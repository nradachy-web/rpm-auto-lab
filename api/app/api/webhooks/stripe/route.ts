import { withCors, json } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { recomputeInvoice } from "@/lib/invoicing";
import { awardLoyalty } from "@/lib/loyalty";

export const runtime = "nodejs";

// Stripe webhook for both deposit (Quote.depositPaidAt) and invoice balance
// (creates a Payment + recomputes the invoice).
export const POST = withCors(async (req) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return json({ error: "Webhook secret not configured" }, { status: 503 });
  }
  const sig = req.headers.get("stripe-signature");
  if (!sig) return json({ error: "Missing signature" }, { status: 400 });
  const body = await req.text();

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return json({ error: "Invalid signature: " + (e instanceof Error ? e.message : "unknown") }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      amount_total: number | null;
      payment_intent: string | null;
      metadata?: Record<string, string> | null;
    };
    const meta = session.metadata ?? {};

    if (meta.kind === "invoice_balance" && meta.invoiceId) {
      const invoice = await prisma.invoice.findUnique({ where: { id: meta.invoiceId } });
      if (invoice && session.amount_total) {
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            userId: invoice.userId,
            amountCents: session.amount_total,
            method: "stripe_checkout",
            reference: session.payment_intent ?? session.id,
          },
        });
        const points = Math.floor(session.amount_total / 100);
        if (points > 0) {
          await awardLoyalty({
            userId: invoice.userId,
            delta: points,
            reason: `Stripe payment on ${invoice.number}`,
            invoiceId: invoice.id,
          });
        }
        await recomputeInvoice(invoice.id);
      }
    } else if (meta.quoteId) {
      // Legacy deposit flow on the Quote model.
      await prisma.quote.update({
        where: { id: meta.quoteId },
        data: { depositPaidAt: new Date(), status: "approved" },
      });
    }
  }
  return json({ received: true });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
