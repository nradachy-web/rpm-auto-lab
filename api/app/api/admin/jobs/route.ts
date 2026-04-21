import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const createSchema = z.object({
  userId: z.string().min(1),
  vehicleId: z.string().min(1),
  quoteId: z.string().min(1).optional(),
  services: z.array(z.string()).min(1),
  scheduledAt: z.string().datetime().optional(),
  adminNote: z.string().max(2000).optional(),
});

// POST — create a job (optionally from a quote)
export const POST = withCors(async (req) => {
  try {
    await requireAdmin();
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    const data = parsed.data;

    const job = await prisma.job.create({
      data: {
        userId: data.userId,
        vehicleId: data.vehicleId,
        quoteId: data.quoteId,
        services: data.services,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        adminNote: data.adminNote,
        status: "scheduled",
        events: { create: [{ toStatus: "scheduled", note: data.adminNote }] },
      },
      include: { vehicle: true, user: true },
    });

    if (data.quoteId) {
      await prisma.quote.update({ where: { id: data.quoteId }, data: { status: "converted" } });
    }

    return json({ job });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
