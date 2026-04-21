import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/auth";
import { newQuoteForShopBody, sendToAddress, welcomeQuoteBody } from "@/lib/email";

export const runtime = "nodejs";

const schema = z.object({
  vehicle: z.object({
    year: z.number().int().min(1900).max(2100),
    make: z.string().min(1).max(80),
    model: z.string().min(1).max(120),
    trim: z.string().max(120).optional(),
    color: z.string().max(80).optional(),
  }),
  services: z.array(z.string().min(1).max(80)).min(1),
  contact: z.object({
    name: z.string().min(1).max(120),
    email: z.string().email().transform((s) => s.toLowerCase().trim()),
    phone: z.string().max(40),
    notes: z.string().max(2000).optional(),
  }),
  estimatedTotal: z.number().int().nonnegative(),
});

const PUBLIC_SITE = process.env.PUBLIC_ORIGIN ?? "https://nradachy-web.github.io";
const PUBLIC_SITE_BASE = PUBLIC_SITE.endsWith("/")
  ? `${PUBLIC_SITE}rpm-auto-lab`
  : `${PUBLIC_SITE}/rpm-auto-lab`;

export const POST = withCors(async (req) => {
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }
  const { vehicle, services, contact, estimatedTotal } = parsed.data;

  // Find-or-create the user. If they already have an account we just attach
  // the new quote to it; if not, we stage a set-password token so they can
  // claim the account from the welcome email.
  const existing = await prisma.user.findUnique({ where: { email: contact.email } });
  let userId: string;
  let setPasswordUrl: string | null = null;

  if (existing) {
    userId = existing.id;
    // Keep the newest name/phone if the user filled different values.
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: contact.name || existing.name,
        phone: contact.phone || existing.phone,
      },
    });
  } else {
    const token = generateToken();
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
    const created = await prisma.user.create({
      data: {
        email: contact.email,
        name: contact.name,
        phone: contact.phone,
        role: "customer",
        setPasswordToken: token,
        setPasswordTokenExpiry: expires,
      },
    });
    userId = created.id;
    setPasswordUrl = `${PUBLIC_SITE_BASE}/portal/set-password?token=${encodeURIComponent(token)}`;
  }

  const veh = await prisma.vehicle.create({
    data: {
      userId,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      color: vehicle.color,
    },
  });

  const quote = await prisma.quote.create({
    data: {
      userId,
      vehicleId: veh.id,
      services,
      estimatedTotal,
      notes: contact.notes,
      status: "submitted",
    },
  });

  const vehicleStr = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ");
  const servicesLine = services.join(", ");
  const quoteSummary = `${vehicleStr}\nServices: ${servicesLine}\nEstimated: $${estimatedTotal.toLocaleString()}`;

  // Fire-and-forget emails — if Web3Forms hiccups we don't want to lose the
  // quote itself, but we DO want to log the failure.
  try {
    if (setPasswordUrl) {
      await sendToAddress(contact.email, {
        subject: "Your RPM Auto Lab quote request",
        message: welcomeQuoteBody({
          name: contact.name,
          setPasswordUrl,
          quoteSummary,
        }),
      });
    } else {
      await sendToAddress(contact.email, {
        subject: "Quote received — RPM Auto Lab",
        message: `Hi ${contact.name},\n\nWe received your quote request and will be in touch within 24 hours.\n\n${quoteSummary}\n\nTrack it in your portal: ${PUBLIC_SITE_BASE}/portal/dashboard\n\n— RPM Auto Lab`,
      });
    }
  } catch (e) { console.error("[quotes/submit] customer email failed:", e); }

  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendToAddress(adminEmail, {
        subject: `New quote — ${contact.name} — ${vehicleStr}`,
        message: newQuoteForShopBody({
          customerName: contact.name,
          customerEmail: contact.email,
          customerPhone: contact.phone,
          vehicle: vehicleStr,
          services,
          estimatedTotal,
          notes: contact.notes,
        }),
      });
    }
  } catch (e) { console.error("[quotes/submit] admin email failed:", e); }

  return json({
    ok: true,
    quoteId: quote.id,
    accountCreated: setPasswordUrl !== null,
  });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
