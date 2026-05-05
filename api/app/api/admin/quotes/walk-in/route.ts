import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError, generateToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const PUBLIC_SITE = process.env.PUBLIC_ORIGIN ?? "https://nradachy-web.github.io";
const PUBLIC_BASE = PUBLIC_SITE.endsWith("/") ? `${PUBLIC_SITE}rpm-auto-lab` : `${PUBLIC_SITE}/rpm-auto-lab`;

const schema = z.object({
  // Customer
  name: z.string().min(1).max(120),
  email: z.string().email().transform((s) => s.toLowerCase().trim()),
  phone: z.string().min(7).max(40),
  // Vehicle
  vehicle: z.object({
    year: z.number().int().min(1900).max(2100),
    make: z.string().min(1).max(80),
    model: z.string().min(1).max(120),
    trim: z.string().max(120).optional(),
    color: z.string().max(80).optional(),
    licensePlate: z.string().max(20).optional(),
    vin: z.string().max(20).optional(),
    sizeTier: z.enum(["compact", "sedan", "suv", "truck", "oversize", "motorcycle", "boat", "rv"]).optional(),
  }),
  // Quote
  services: z.array(z.string().min(1).max(80)).min(1),
  quotedAmount: z.number().int().nonnegative(),
  notes: z.string().max(2000).optional(),
  source: z.enum(["google", "facebook", "instagram", "referral", "website", "phone", "walkin", "in_person", "other"]).default("phone"),
  partsDiagram: z.record(z.string()).optional(),
  options: z.array(z.object({
    name: z.string().min(1).max(80),
    description: z.string().max(280).optional(),
    priceCents: z.number().int().nonnegative(),
    durationMinutes: z.number().int().positive().optional(),
    recommended: z.boolean().optional(),
  })).optional(),
  // Optional: schedule the job in the same step.
  schedule: z.object({
    startAt: z.string().datetime(),
    durationMinutes: z.number().int().positive().default(120),
    bayId: z.string().nullable().optional(),
    technicianId: z.string().nullable().optional(),
  }).optional(),
});

export const POST = withCors(async (req) => {
  try {
    await requireAdmin();
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    const { name, email, phone, vehicle, services, quotedAmount, notes, source } = parsed.data;

    // Find or create the customer.
    let user = await prisma.user.findUnique({ where: { email } });
    let setPasswordUrl: string | null = null;
    if (!user) {
      const token = generateToken();
      user = await prisma.user.create({
        data: {
          email,
          name,
          phone,
          role: "customer",
          setPasswordToken: token,
          setPasswordTokenExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });
      setPasswordUrl = `${PUBLIC_BASE}/portal/set-password?token=${encodeURIComponent(token)}`;
    } else {
      // Update name/phone if shop knows fresher info.
      await prisma.user.update({ where: { id: user.id }, data: { name, phone } });
    }

    // Find or create the vehicle (loose match on year+make+model).
    let veh = await prisma.vehicle.findFirst({
      where: {
        userId: user.id,
        year: vehicle.year,
        make: { equals: vehicle.make, mode: "insensitive" },
        model: { equals: vehicle.model, mode: "insensitive" },
      },
    });
    if (!veh) {
      veh = await prisma.vehicle.create({ data: { ...vehicle, userId: user.id } });
    }

    // Create the quote, already priced + responded.
    const publicToken = generateToken();
    const quote = await prisma.quote.create({
      data: {
        userId: user.id,
        vehicleId: veh.id,
        services,
        estimatedTotal: quotedAmount,
        quotedAmount,
        notes,
        status: "quoted",
        respondedAt: new Date(),
        source,
        partsDiagram: parsed.data.partsDiagram ?? undefined,
        publicToken,
        options: parsed.data.options && parsed.data.options.length > 0 ? {
          create: parsed.data.options.map((o, i) => ({
            name: o.name,
            description: o.description,
            priceCents: o.priceCents,
            durationMinutes: o.durationMinutes,
            recommended: o.recommended ?? false,
            sortOrder: i,
          })),
        } : undefined,
      },
    });

    // Optionally schedule a Job in the same step.
    let jobId: string | null = null;
    if (parsed.data.schedule) {
      const start = new Date(parsed.data.schedule.startAt);
      const dur = parsed.data.schedule.durationMinutes;
      const end = new Date(start.getTime() + dur * 60 * 1000);
      const job = await prisma.job.create({
        data: {
          userId: user.id,
          vehicleId: veh.id,
          quoteId: quote.id,
          services,
          status: "scheduled",
          scheduledAt: start,
          scheduledStartAt: start,
          scheduledEndAt: end,
          durationMinutes: dur,
          bayId: parsed.data.schedule.bayId ?? null,
          technicianId: parsed.data.schedule.technicianId ?? null,
        },
      });
      // Mark the quote as converted now that the job exists.
      await prisma.quote.update({ where: { id: quote.id }, data: { status: "converted" } });
      jobId = job.id;
    }

    return json({
      ok: true,
      quoteId: quote.id,
      jobId,
      userId: user.id,
      vehicleId: veh.id,
      setPasswordUrl,                   // for the welcome email if account is new
      portalUrl: `${PUBLIC_BASE}/portal/quotes`,
      publicQuoteUrl: `${PUBLIC_BASE}/portal/quote-accept?token=${encodeURIComponent(publicToken)}`,
    });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    const msg = e instanceof Error ? e.message : "Server error";
    return json({ error: msg }, { status: 500 });
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
