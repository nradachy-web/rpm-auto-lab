import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { planBySlug } from "@/lib/subscription-plans";

export const runtime = "nodejs";

const PUBLIC_SITE = process.env.PUBLIC_ORIGIN ?? "https://nradachy-web.github.io";
const PUBLIC_BASE = PUBLIC_SITE.endsWith("/") ? `${PUBLIC_SITE}rpm-auto-lab` : `${PUBLIC_SITE}/rpm-auto-lab`;

const schema = z.object({ planSlug: z.string().min(1) });

export const POST = withCors(async (req) => {
  const user = await currentUser();
  if (!user) return json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!process.env.STRIPE_SECRET_KEY) {
    return json({ error: "Stripe not configured. Set STRIPE_SECRET_KEY in Vercel." }, { status: 503 });
  }
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });
  const plan = planBySlug(parsed.data.planSlug);
  if (!plan) return json({ error: "Unknown plan" }, { status: 404 });

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: plan.priceCents,
          recurring: { interval: plan.stripeInterval, interval_count: plan.stripeIntervalCount },
          product_data: { name: plan.name, description: plan.description },
        },
      },
    ],
    success_url: `${PUBLIC_BASE}/portal/subscriptions?success=${encodeURIComponent(plan.slug)}`,
    cancel_url: `${PUBLIC_BASE}/portal/subscriptions?cancelled=${encodeURIComponent(plan.slug)}`,
    metadata: { kind: "subscription", planSlug: plan.slug, userId: user.id },
  });

  // Pre-create a pending Subscription row; webhook will fill in stripeSubscriptionId.
  await prisma.subscription.create({
    data: {
      userId: user.id,
      packageSlug: plan.slug,
      intervalDays: plan.intervalDays,
      priceCents: plan.priceCents,
      status: "active",
      stripeCustomerId: null,
    },
  });

  return json({ url: session.url });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
