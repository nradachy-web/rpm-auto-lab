import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getConnection } from "@/lib/google";

export const runtime = "nodejs";

export const GET = withCors(async () => {
  try {
    await requireAdmin();
    const conn = await getConnection();
    if (!conn) return json({ connected: false });
    return json({
      connected: true,
      googleEmail: conn.googleEmail,
      calendarId: conn.calendarId,
      gbpLocationId: conn.gbpLocationId,
      sendAsEmail: conn.sendAsEmail,
      scopes: conn.scopes,
      connectedAt: conn.createdAt,
    });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

const patchSchema = z.object({
  calendarId: z.string().min(1).max(200).optional(),
  gbpLocationId: z.string().nullable().optional(),
  sendAsEmail: z.string().email().nullable().optional(),
});

export const PATCH = withCors(async (req) => {
  try {
    await requireAdmin();
    const conn = await getConnection();
    if (!conn) return json({ error: "Not connected" }, { status: 400 });
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });
    const updated = await prisma.googleConnection.update({ where: { id: conn.id }, data: parsed.data });
    return json({ ok: true, connection: { calendarId: updated.calendarId, gbpLocationId: updated.gbpLocationId, sendAsEmail: updated.sendAsEmail } });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const DELETE = withCors(async () => {
  try {
    await requireAdmin();
    await prisma.googleConnection.deleteMany({ where: { scope: "shop" } });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
