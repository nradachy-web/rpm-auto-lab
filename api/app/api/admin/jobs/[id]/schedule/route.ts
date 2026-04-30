import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  scheduledStartAt: z.string().datetime().nullable().optional(),
  scheduledEndAt: z.string().datetime().nullable().optional(),
  durationMinutes: z.number().int().positive().nullable().optional(),
  bayId: z.string().nullable().optional(),
  technicianId: z.string().nullable().optional(),
  // Back-compat alias
  scheduledAt: z.string().datetime().nullable().optional(),
});

export const PATCH = withCors(async (req) => {
  try {
    await requireAdmin();
    const id = new URL(req.url).pathname.split("/").slice(-2, -1)[0];
    if (!id) return json({ error: "Missing job id" }, { status: 400 });
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });

    const start = parsed.data.scheduledStartAt ?? parsed.data.scheduledAt;
    const end = parsed.data.scheduledEndAt;
    const data: Record<string, unknown> = {};
    if (start !== undefined) {
      data.scheduledStartAt = start ? new Date(start) : null;
      data.scheduledAt = start ? new Date(start) : null;
    }
    if (end !== undefined) data.scheduledEndAt = end ? new Date(end) : null;
    if (parsed.data.durationMinutes !== undefined) data.durationMinutes = parsed.data.durationMinutes;
    if (parsed.data.bayId !== undefined) data.bayId = parsed.data.bayId;
    if (parsed.data.technicianId !== undefined) data.technicianId = parsed.data.technicianId;

    const updated = await prisma.job.update({
      where: { id },
      data,
      include: { user: { select: { email: true, name: true } }, vehicle: true, bay: true, technician: true },
    });
    return json({ job: updated });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
