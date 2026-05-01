import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { recomputeInvoice } from "@/lib/invoicing";

export const runtime = "nodejs";

const actionSchema = z.object({
  action: z.enum(["approve", "decline"]),
  declineReason: z.string().max(280).optional(),
});

function tokenFrom(req: Request): string | null {
  const segs = new URL(req.url).pathname.split("/");
  return segs[segs.length - 1] || null;
}

export const GET = withCors(async (req) => {
  const token = tokenFrom(req);
  if (!token) return json({ error: "Missing token" }, { status: 400 });
  const co = await prisma.changeOrder.findUnique({
    where: { approvalToken: token },
    include: { job: { include: { vehicle: true, user: { select: { name: true } } } } },
  });
  if (!co) return json({ error: "Invalid link" }, { status: 404 });
  return json({
    changeOrder: {
      id: co.id,
      description: co.description,
      quantity: co.quantity,
      unitCents: co.unitCents,
      totalCents: co.totalCents,
      photoUrl: co.photoUrl,
      status: co.status,
      approvedAt: co.approvedAt,
      declinedAt: co.declinedAt,
      createdAt: co.createdAt,
    },
    job: {
      id: co.job.id,
      services: co.job.services,
      vehicle: co.job.vehicle,
      customerName: co.job.user.name,
    },
  });
});

export const POST = withCors(async (req) => {
  const token = tokenFrom(req);
  if (!token) return json({ error: "Missing token" }, { status: 400 });
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });

  const co = await prisma.changeOrder.findUnique({
    where: { approvalToken: token },
    include: { job: { include: { invoice: true } } },
  });
  if (!co) return json({ error: "Invalid link" }, { status: 404 });
  if (co.status !== "pending") return json({ error: "This change order has already been resolved." }, { status: 409 });

  if (parsed.data.action === "decline") {
    await prisma.changeOrder.update({
      where: { id: co.id },
      data: { status: "declined", declinedAt: new Date(), declineReason: parsed.data.declineReason ?? null },
    });
    return json({ ok: true, status: "declined" });
  }

  // Approve: append a line item to the invoice (creating the invoice if there
  // isn't one yet — the change order pre-dates billing in some flows).
  let invoiceId = co.invoiceId ?? co.job.invoiceId ?? null;
  if (!invoiceId) {
    // Lazy-create a draft invoice for this job; will be reconciled at pickup.
    const number = `CO-${co.id.slice(-6).toUpperCase()}`;
    const inv = await prisma.invoice.create({
      data: {
        userId: co.job.userId,
        number,
        status: "draft",
        taxRateBps: 600,
      },
    });
    await prisma.job.update({ where: { id: co.jobId }, data: { invoiceId: inv.id } });
    invoiceId = inv.id;
  }
  const itemCount = await prisma.invoiceLineItem.count({ where: { invoiceId } });
  const item = await prisma.invoiceLineItem.create({
    data: {
      invoiceId,
      description: `[change order] ${co.description}`,
      quantity: co.quantity,
      unitCents: co.unitCents,
      totalCents: co.totalCents,
      sortOrder: itemCount,
    },
  });
  await prisma.changeOrder.update({
    where: { id: co.id },
    data: { status: "approved", approvedAt: new Date(), invoiceId, resultingLineItemId: item.id },
  });
  await recomputeInvoice(invoiceId);
  return json({ ok: true, status: "approved" });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
