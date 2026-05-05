import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rulesForServices } from "@/lib/reminders";
import { sendSms, SMS_TEMPLATES } from "@/lib/twilio";
import { computeCure } from "@/lib/cure";

const PUBLIC_SITE = process.env.PUBLIC_ORIGIN ?? "https://nradachy-web.github.io";
const PUBLIC_BASE = PUBLIC_SITE.endsWith("/") ? `${PUBLIC_SITE}rpm-auto-lab` : `${PUBLIC_SITE}/rpm-auto-lab`;

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
      cureUntil?: Date | null;
      cureKind?: string | null;
    } = {
      status,
      adminNote: note ?? existing.adminNote,
      events: { create: { fromStatus: existing.status, toStatus: status, note: note ?? null } },
    };
    if (stampKey) updateData[stampKey] = new Date();
    // On completion, compute the cure window so the customer tracker
    // shows the "do not wash" countdown.
    if (status === "completed" && !existing.completedAt) {
      const cure = computeCure(existing.services, new Date());
      updateData.cureUntil = cure.cureUntil;
      updateData.cureKind = cure.cureKind;
    }

    const updated = await prisma.job.update({
      where: { id },
      data: updateData,
      include: { user: true, vehicle: true, events: { orderBy: { at: "desc" } } },
    });

    // When a job transitions to completed for the first time, queue
    // follow-up reminders (e.g. ceramic refresh at +180d). Skip if the job
    // already had completedAt (idempotent on re-clicks).
    if (status === "completed" && !existing.completedAt) {
      const rules = rulesForServices(updated.services);
      const now = Date.now();
      await prisma.scheduledReminder.createMany({
        data: rules.map((r) => ({
          userId: updated.userId,
          jobId: updated.id,
          vehicleId: updated.vehicleId,
          type: r.type,
          dueAt: new Date(now + r.daysOut * 24 * 60 * 60 * 1000),
        })),
        skipDuplicates: true,
      });
    }

    // On pickup, queue a review request +1 day.
    if (status === "picked_up" && !existing.pickedUpAt) {
      await prisma.scheduledReminder.create({
        data: {
          userId: updated.userId,
          jobId: updated.id,
          vehicleId: updated.vehicleId,
          type: "review_request",
          dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      await prisma.reviewRequest.create({
        data: {
          userId: updated.userId,
          jobId: updated.id,
          vehicleId: updated.vehicleId,
        },
      });
    }

    // SMS is sent server-side because Twilio works server-to-server. Email
    // is fired from the admin browser via Web3Forms.
    if (updated.user.smsConsent && updated.user.phone) {
      const veh = [updated.vehicle.year, updated.vehicle.make, updated.vehicle.model].join(" ");
      sendSms(
        updated.user.phone,
        SMS_TEMPLATES.jobStatus({
          name: updated.user.name,
          vehicle: veh,
          newStatus: status,
          portalUrl: `${PUBLIC_BASE}/portal/jobs`,
        })
      ).catch((e) => console.error("[twilio] sms failed:", e));
    }

    return json({ job: updated });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
