import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export const GET = withCors(async (req) => {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const includeArchived = url.searchParams.get("includeArchived") === "true";
    const [customers, quotes, jobs] = await Promise.all([
      prisma.user.findMany({
        where: includeArchived
          ? { role: "customer" }
          : { role: "customer", archivedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, email: true, name: true, phone: true, createdAt: true, notes: true, archivedAt: true,
          _count: { select: { vehicles: true, quotes: true, jobs: true } },
        },
      }),
      prisma.quote.findMany({
        orderBy: { submittedAt: "desc" },
        take: 50,
        include: { user: { select: { id: true, email: true, name: true } }, vehicle: true },
      }),
      prisma.job.findMany({
        orderBy: { updatedAt: "desc" },
        take: 100,
        include: {
          user: { select: { id: true, email: true, name: true } },
          vehicle: true,
          events: { orderBy: { at: "desc" }, take: 1 },
          photos: { orderBy: { uploadedAt: "asc" } },
          bay: true,
          technician: true,
          invoice: { select: { id: true, number: true, status: true, totalCents: true, paidCents: true, balanceCents: true } },
        },
      }),
    ]);
    return json({ customers, quotes, jobs });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
