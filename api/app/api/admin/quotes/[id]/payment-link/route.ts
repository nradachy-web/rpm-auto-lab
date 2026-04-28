import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe, DEFAULT_DEPOSIT_RATIO } from "@/lib/stripe";

export const runtime = "nodejs";

const schema = z.object({
  // Optional cents override; otherwise we use 25% of quotedAmount.
  depositCents: z.number().int().positive().optional(),
});

const PUBLIC_SITE = process.env.PUBLIC_ORIGIN ?? "https://nradachy-web.github.io";
const PUBLIC_BASE = PUBLIC_SITE.endsWith("/") ? `${PUBLIC_SITE}rpm-auto-lab` : `${PUBLIC_SITE}/rpm-auto-lab`;

export const POST = withCors(async (req) => {
  try {
    await requireAdmin();
    const id = new URL(req.url).pathname.split("/").slice(-2, -1)[0];
    if (!id) return json({ error: "Missing quote id" }, { status: 400 });

    let body: unknown = null;
    try { body = await req.json(); } catch { /* empty body is fine */ }
    const parsed = schema.safeParse(body ?? {});
    if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { user: true, vehicle: true },
    });
    if (!quote) return json({ error: "Quote not found" }, { status: 404 });
    if (!quote.quotedAmount) return json({ error: "Set a quote amount before generating a payment link" }, { status: 400 });

    const depositCents = parsed.data.depositCents
      ?? Math.max(100, Math.round(quote.quotedAmount * 100 * DEFAULT_DEPOSIT_RATIO));

    if (!process.env.STRIPE_SECRET_KEY) {
      return json({ error: "Stripe is not configured. Set STRIPE_SECRET_KEY in Vercel." }, { status: 503 });
    }

    const stripe = getStripe();
    const vehStr = `${quote.vehicle.year} ${quote.vehicle.make} ${quote.vehicle.model}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: quote.user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: depositCents,
            product_data: {
              name: `Deposit — ${vehStr}`,
              description: quote.services.join(", "),
            },
          },
        },
      ],
      success_url: `${PUBLIC_BASE}/portal/quotes?deposit=paid`,
      cancel_url: `${PUBLIC_BASE}/portal/quotes?deposit=cancelled`,
      metadata: { quoteId: quote.id },
    });

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        depositAmount: depositCents,
        stripeCheckoutSessionId: session.id,
        stripePaymentLinkUrl: session.url,
      },
    });
    return json({ quote: updated, paymentLinkUrl: session.url });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    const msg = e instanceof Error ? e.message : "Stripe error";
    return json({ error: msg }, { status: 500 });
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
