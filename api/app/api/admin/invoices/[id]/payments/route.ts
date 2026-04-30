import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recomputeInvoice } from "@/lib/invoicing";
import { awardLoyalty } from "@/lib/loyalty";

export const runtime = "nodejs";

const schema = z.object({
  amountCents: z.number().int().positive(),
  method: z.enum(["cash", "card_in_person", "stripe_checkout", "stripe_terminal", "ach", "check", "other"]),
  reference: z.string().max(120).optional(),
  note: z.string().max(280).optional(),
});

export const POST = withCors(async (req) => {
  try {
    await requireAdmin();
    const invoiceId = new URL(req.url).pathname.split("/").slice(-2, -1)[0];
    if (!invoiceId) return json({ error: "Missing invoice id" }, { status: 400 });
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return json({ error: "Invoice not found" }, { status: 404 });
    await prisma.payment.create({
      data: {
        invoiceId,
        userId: invoice.userId,
        amountCents: parsed.data.amountCents,
        method: parsed.data.method,
        reference: parsed.data.reference,
        note: parsed.data.note,
      },
    });
    // Award 1 loyalty point per dollar paid.
    const points = Math.floor(parsed.data.amountCents / 100);
    if (points > 0) {
      await awardLoyalty({
        userId: invoice.userId,
        delta: points,
        reason: `Payment on ${invoice.number}`,
        invoiceId,
      });
    }
    const fresh = await recomputeInvoice(invoiceId);
    return json({ invoice: fresh });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
