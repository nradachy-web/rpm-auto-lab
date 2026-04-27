import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  status: z.enum(["scheduled", "in_progress", "completed", "picked_up", "cancelled"]),
  note: z.string().max(2000).optional(),
});

export const PATCH = withCors(async (req) => {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const id = url.pathname.split("/").slice(-2, -1)[0]; // /admin/jobs/:id/status
    if (!id) return json({ error: "Missing job id" }, { status: 400 });
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    const { status, note } = parsed.data;

    const existing = await prisma.job.findUnique({
      where: { id },
      include: { user: true, vehicle: true },
    });
    if (!existing) return json({ error: "Job not found" }, { status: 404 });

    // Stamp the transition timestamp on whichever column matches.
    const stampKey =
      status === "scheduled" ? "scheduledAt" :
      status === "in_progress" ? "startedAt" :
      status === "completed" ? "completedAt" :
      status === "picked_up" ? "pickedUpAt" :
      null;

    const updateData: {
      status: typeof status;
      adminNote: string | null;
      events: { create: { fromStatus: typeof existing.status; toStatus: typeof status; note: string | null } };
      scheduledAt?: Date;
      startedAt?: Date;
      completedAt?: Date;
      pickedUpAt?: Date;
    } = {
      status,
      adminNote: note ?? existing.adminNote,
      events: { create: { fromStatus: existing.status, toStatus: status, note: note ?? null } },
    };
    if (stampKey) updateData[stampKey] = new Date();

    const updated = await prisma.job.update({
      where: { id },
      data: updateData,
      include: { user: true, vehicle: true, events: { orderBy: { at: "desc" } } },
    });

    // Customer email is sent client-side from /portal/admin (Web3Forms blocks
    // server-side calls on the free plan).
    return json({ job: updated });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
