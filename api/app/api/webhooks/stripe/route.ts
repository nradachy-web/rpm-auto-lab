import { withCors, json } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Stripe sends signed events here. We watch for checkout.session.completed
// and stamp the matching Quote as deposit-paid.
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
    const session = event.data.object as { id: string; metadata?: Record<string, string> | null };
    const quoteId = session.metadata?.quoteId;
    if (quoteId) {
      await prisma.quote.update({
        where: { id: quoteId },
        data: { depositPaidAt: new Date(), status: "approved" },
      });
    }
  }
  return json({ received: true });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
