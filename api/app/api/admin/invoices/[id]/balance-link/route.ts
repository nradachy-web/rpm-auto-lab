import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const PUBLIC_SITE = process.env.PUBLIC_ORIGIN ?? "https://nradachy-web.github.io";
const PUBLIC_BASE = PUBLIC_SITE.endsWith("/") ? `${PUBLIC_SITE}rpm-auto-lab` : `${PUBLIC_SITE}/rpm-auto-lab`;

export const POST = withCors(async (req) => {
  try {
    await requireAdmin();
    const id = new URL(req.url).pathname.split("/").slice(-2, -1)[0];
    if (!id) return json({ error: "Missing invoice id" }, { status: 400 });

    if (!process.env.STRIPE_SECRET_KEY) {
      return json({ error: "Stripe is not configured. Set STRIPE_SECRET_KEY in Vercel." }, { status: 503 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!invoice) return json({ error: "Invoice not found" }, { status: 404 });
    if (invoice.balanceCents <= 0) return json({ error: "Invoice has no outstanding balance" }, { status: 400 });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: invoice.user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: invoice.balanceCents,
            product_data: {
              name: `${invoice.number} balance`,
              description: invoice.notes?.slice(0, 280) || undefined,
            },
          },
        },
      ],
      success_url: `${PUBLIC_BASE}/portal/invoices?paid=${invoice.number}`,
      cancel_url: `${PUBLIC_BASE}/portal/invoices?cancelled=${invoice.number}`,
      metadata: { invoiceId: invoice.id, kind: "invoice_balance" },
    });

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        stripeBalanceSessionId: session.id,
        stripeBalanceUrl: session.url,
      },
    });
    return json({ invoice: updated, paymentLinkUrl: session.url });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    const msg = e instanceof Error ? e.message : "Stripe error";
    return json({ error: msg }, { status: 500 });
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
