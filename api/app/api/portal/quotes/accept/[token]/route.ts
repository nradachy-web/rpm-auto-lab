import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function tokenFrom(req: Request): string | null {
  const segs = new URL(req.url).pathname.split("/");
  return segs[segs.length - 1] || null;
}

export const GET = withCors(async (req) => {
  const token = tokenFrom(req);
  if (!token) return json({ error: "Missing token" }, { status: 400 });
  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    include: {
      vehicle: { select: { year: true, make: true, model: true, trim: true, color: true, sizeTier: true } },
      user: { select: { name: true } },
      options: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!quote) return json({ error: "This quote link is invalid or has been removed." }, { status: 404 });
  return json({
    quote: {
      id: quote.id,
      services: quote.services,
      estimatedTotal: quote.estimatedTotal,
      quotedAmount: quote.quotedAmount,
      notes: quote.notes,
      status: quote.status,
      submittedAt: quote.submittedAt,
      respondedAt: quote.respondedAt,
      acceptedAt: quote.acceptedAt,
      selectedOptionId: quote.selectedOptionId,
      partsDiagram: quote.partsDiagram,
      depositAmount: quote.depositAmount,
      stripePaymentLinkUrl: quote.stripePaymentLinkUrl,
    },
    vehicle: quote.vehicle,
    customerName: quote.user.name,
    options: quote.options.map((o) => ({
      id: o.id,
      name: o.name,
      description: o.description,
      priceCents: o.priceCents,
      durationMinutes: o.durationMinutes,
      recommended: o.recommended,
    })),
  });
});

const acceptSchema = z.object({ optionId: z.string().min(1).optional() });

export const POST = withCors(async (req) => {
  const token = tokenFrom(req);
  if (!token) return json({ error: "Missing token" }, { status: 400 });
  let body: unknown = {};
  try { body = await req.json(); } catch { /* allow empty body */ }
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });

  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    include: { options: true },
  });
  if (!quote) return json({ error: "Invalid link" }, { status: 404 });
  if (quote.acceptedAt) return json({ error: "This quote was already accepted." }, { status: 409 });

  let chosenOptionId: string | null = null;
  let newQuotedAmount = quote.quotedAmount;
  if (parsed.data.optionId) {
    const opt = quote.options.find((o) => o.id === parsed.data.optionId);
    if (!opt) return json({ error: "That option no longer exists." }, { status: 400 });
    chosenOptionId = opt.id;
    newQuotedAmount = Math.round(opt.priceCents / 100);
  }

  const updated = await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: "approved",
      acceptedAt: new Date(),
      selectedOptionId: chosenOptionId,
      quotedAmount: newQuotedAmount ?? quote.quotedAmount,
      respondedAt: quote.respondedAt ?? new Date(),
    },
  });

  await prisma.adminNotification.create({
    data: {
      kind: "other",
      title: `Quote accepted by customer`,
      body: chosenOptionId ? `Picked option ${chosenOptionId}` : `Accepted base price`,
      href: `/portal/admin`,
    },
  });

  return json({ ok: true, quote: { id: updated.id, status: updated.status, quotedAmount: updated.quotedAmount } });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
