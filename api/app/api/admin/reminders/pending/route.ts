import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Returns reminders whose dueAt has passed and that haven't been sent or
// cancelled. The admin dashboard polls this and fires emails client-side.
export const GET = withCors(async () => {
  try {
    await requireAdmin();
    const reminders = await prisma.scheduledReminder.findMany({
      where: {
        sentAt: null,
        cancelledAt: null,
        dueAt: { lte: new Date() },
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        vehicle: { select: { id: true, year: true, make: true, model: true, trim: true } },
        job: { select: { id: true, services: true } },
      },
      orderBy: { dueAt: "asc" },
      take: 50,
    });
    return json({ reminders });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
