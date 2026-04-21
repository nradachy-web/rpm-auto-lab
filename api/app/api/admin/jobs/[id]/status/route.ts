import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jobStatusBody, sendToAddress } from "@/lib/email";

export const runtime = "nodejs";

const schema = z.object({
  status: z.enum(["scheduled", "in_progress", "completed", "picked_up", "cancelled"]),
  note: z.string().max(2000).optional(),
});

const PUBLIC_SITE = process.env.PUBLIC_ORIGIN ?? "https://nradachy-web.github.io";
const PUBLIC_BASE = PUBLIC_SITE.endsWith("/") ? `${PUBLIC_SITE}rpm-auto-lab` : `${PUBLIC_SITE}/rpm-auto-lab`;

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

    // Notify the customer by email.
    try {
      const v = updated.vehicle;
      const vehicleStr = [v.year, v.make, v.model].join(" ");
      await sendToAddress(updated.user.email, {
        subject: `RPM Auto Lab — Job update (${statusLabel(status)})`,
        message: jobStatusBody({
          name: updated.user.name,
          vehicle: vehicleStr,
          newStatus: status,
          note,
          portalUrl: `${PUBLIC_BASE}/portal/jobs`,
        }),
      });
    } catch (e) {
      console.error("[admin/jobs/status] email failed:", e);
    }

    return json({ job: updated });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));

function statusLabel(s: string): string {
  switch (s) {
    case "in_progress": return "In Progress";
    case "picked_up": return "Picked Up";
    default: return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
