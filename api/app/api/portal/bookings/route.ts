import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  vehicleId: z.string().min(1),
  packageSlugs: z.array(z.string().min(1)).min(1),
  scheduledStartAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().max(2000).optional(),
});

export const POST = withCors(async (req) => {
  const user = await currentUser();
  if (!user) return json({ error: "UNAUTHENTICATED" }, { status: 401 });
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });

  const veh = await prisma.vehicle.findFirst({
    where: { id: parsed.data.vehicleId, userId: user.id },
  });
  if (!veh) return json({ error: "Vehicle not found" }, { status: 404 });

  const start = new Date(parsed.data.scheduledStartAt);
  const packages = await prisma.servicePackage.findMany({
    where: { slug: { in: parsed.data.packageSlugs }, active: true },
  });
  if (packages.length === 0) return json({ error: "Unknown packages" }, { status: 400 });

  const totalDuration = parsed.data.durationMinutes
    ?? packages.reduce((s, p) => s + p.defaultDurationMinutes, 0);
  const end = new Date(start.getTime() + totalDuration * 60 * 1000);

  const job = await prisma.job.create({
    data: {
      userId: user.id,
      vehicleId: veh.id,
      services: parsed.data.packageSlugs,
      status: "scheduled",
      scheduledAt: start,
      scheduledStartAt: start,
      scheduledEndAt: end,
      durationMinutes: totalDuration,
      adminNote: parsed.data.notes,
    },
  });

  await prisma.adminNotification.create({
    data: {
      kind: "booking_request",
      title: `New booking from ${user.name}`,
      body: `${start.toLocaleString()} — ${parsed.data.packageSlugs.join(", ")}`,
      href: `/portal/admin/schedule`,
    },
  });

  return json({ ok: true, jobId: job.id });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
