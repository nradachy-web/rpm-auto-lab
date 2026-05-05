import { prisma } from "./db";
import { getAccessToken, getConnection } from "./google";

interface JobSyncShape {
  id: string;
  scheduledStartAt: Date | null;
  scheduledEndAt: Date | null;
  durationMinutes: number | null;
  services: string[];
  user: { name: string; email: string; phone: string | null };
  vehicle: { year: number; make: string; model: string };
  bay?: { name: string } | null;
  technician?: { name: string } | null;
}

// Push a job to Google Calendar. Idempotent — uses our JobCalendarEvent
// mirror to update an existing event when one exists, otherwise creates
// a new one. Silently no-ops if the shop hasn't connected Google yet.
export async function syncJobToCalendar(jobId: string): Promise<void> {
  const conn = await getConnection();
  if (!conn) return;
  const accessToken = await getAccessToken();
  if (!accessToken) return;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      vehicle: { select: { year: true, make: true, model: true } },
      bay: { select: { name: true } },
      technician: { select: { name: true } },
    },
  });
  if (!job) return;
  if (!job.scheduledStartAt) {
    // Unscheduled — make sure any existing event is removed.
    await deleteJobEvent(jobId);
    return;
  }

  const event = buildEventBody(job as unknown as JobSyncShape);
  const mirror = await prisma.jobCalendarEvent.findUnique({ where: { jobId } });

  if (mirror && mirror.calendarId === conn.calendarId) {
    // Update.
    const r = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(conn.calendarId)}/events/${encodeURIComponent(mirror.googleEventId)}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }
    );
    if (r.ok) {
      await prisma.jobCalendarEvent.update({ where: { jobId }, data: { syncedAt: new Date() } });
      return;
    }
    // If the event was deleted on Google's side, fall through to create.
    if (r.status !== 404 && r.status !== 410) {
      console.error("[gcal] update failed:", r.status, await r.text().catch(() => ""));
      return;
    }
    await prisma.jobCalendarEvent.delete({ where: { jobId } });
  }

  // Create.
  const r = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(conn.calendarId)}/events`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }
  );
  if (!r.ok) {
    console.error("[gcal] create failed:", r.status, await r.text().catch(() => ""));
    return;
  }
  const body = await r.json() as { id: string };
  await prisma.jobCalendarEvent.create({
    data: { jobId, googleEventId: body.id, calendarId: conn.calendarId },
  });
}

export async function deleteJobEvent(jobId: string): Promise<void> {
  const mirror = await prisma.jobCalendarEvent.findUnique({ where: { jobId } });
  if (!mirror) return;
  const accessToken = await getAccessToken();
  if (!accessToken) return;
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(mirror.calendarId)}/events/${encodeURIComponent(mirror.googleEventId)}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  await prisma.jobCalendarEvent.delete({ where: { jobId } });
}

function buildEventBody(job: JobSyncShape) {
  const start = job.scheduledStartAt!;
  const end = job.scheduledEndAt
    ?? new Date(start.getTime() + (job.durationMinutes ?? 120) * 60 * 1000);
  const veh = `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`;
  const summary = `${veh} — ${job.user.name}`;
  const descLines = [
    `Customer: ${job.user.name}`,
    `Email: ${job.user.email}`,
    job.user.phone ? `Phone: ${job.user.phone}` : null,
    `Services: ${job.services.join(", ")}`,
    job.bay?.name ? `Bay: ${job.bay.name}` : null,
    job.technician?.name ? `Tech: ${job.technician.name}` : null,
    "",
    "(Created by RPM Auto Lab portal — do not edit times here, edit on the portal Schedule.)",
  ].filter(Boolean);
  return {
    summary,
    description: descLines.join("\n"),
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    extendedProperties: { private: { rpmJobId: job.id } },
  };
}
