import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function parseRange(url: URL) {
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const now = new Date();
  const to = toStr ? new Date(toStr) : now;
  const from = fromStr ? new Date(fromStr) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from, to };
}

export const GET = withCors(async (req) => {
  try {
    await requireAdmin();
    const { from, to } = parseRange(new URL(req.url));

    const [paymentsAgg, completedJobs, allJobs, allQuotes, paymentsByDay] = await Promise.all([
      prisma.payment.aggregate({
        where: { receivedAt: { gte: from, lte: to } },
        _sum: { amountCents: true },
        _count: true,
      }),
      prisma.job.count({
        where: { completedAt: { gte: from, lte: to } },
      }),
      prisma.job.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { id: true, services: true, status: true, technicianId: true, bayId: true },
      }),
      prisma.quote.count({
        where: { submittedAt: { gte: from, lte: to } },
      }),
      prisma.payment.findMany({
        where: { receivedAt: { gte: from, lte: to } },
        select: { amountCents: true, receivedAt: true },
      }),
    ]);

    const convertedQuotes = await prisma.quote.count({
      where: { submittedAt: { gte: from, lte: to }, status: "converted" },
    });

    // Material cost: any inventory transaction in range with a cost.
    const inventoryTx = await prisma.inventoryTransaction.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { item: { select: { costCents: true } } },
    });
    let materialCostCents = 0;
    for (const t of inventoryTx) {
      if (t.delta < 0 && t.item?.costCents) {
        materialCostCents += Math.abs(t.delta) * t.item.costCents;
      }
    }

    const revenueCents = paymentsAgg._sum.amountCents ?? 0;
    const paymentCount = paymentsAgg._count ?? 0;
    const avgTicketCents = paymentCount > 0 ? Math.round(revenueCents / paymentCount) : 0;
    const conversionRateBps = allQuotes > 0 ? Math.round((convertedQuotes / allQuotes) * 10000) : 0;

    // Top services across all jobs created in range
    const serviceCount: Record<string, number> = {};
    for (const j of allJobs) {
      for (const s of j.services) {
        serviceCount[s] = (serviceCount[s] || 0) + 1;
      }
    }
    const topServices = Object.entries(serviceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([slug, count]) => ({ slug, count }));

    // Daily revenue series
    const daily = new Map<string, number>();
    for (const p of paymentsByDay) {
      const key = p.receivedAt.toISOString().slice(0, 10);
      daily.set(key, (daily.get(key) || 0) + p.amountCents);
    }
    const days: { date: string; revenueCents: number }[] = [];
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= to) {
      const key = cursor.toISOString().slice(0, 10);
      days.push({ date: key, revenueCents: daily.get(key) || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    return json({
      range: { from: from.toISOString(), to: to.toISOString() },
      revenueCents,
      paymentCount,
      completedJobs,
      jobsCreated: allJobs.length,
      quotesCreated: allQuotes,
      convertedQuotes,
      conversionRateBps,
      avgTicketCents,
      topServices,
      daily: days,
      materialCostCents,
      grossMarginCents: revenueCents - materialCostCents,
    });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
