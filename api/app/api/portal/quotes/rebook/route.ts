import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  jobId: z.string().min(1).optional(),
  vehicleId: z.string().min(1),
  services: z.array(z.string().min(1).max(80)).min(1),
  estimatedTotal: z.number().int().nonnegative().optional(),
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

  const quote = await prisma.quote.create({
    data: {
      userId: user.id,
      vehicleId: veh.id,
      services: parsed.data.services,
      estimatedTotal: parsed.data.estimatedTotal ?? 0,
      notes: parsed.data.notes,
      status: "submitted",
    },
  });
  return json({ ok: true, quoteId: quote.id });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
