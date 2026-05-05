import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const patchSchema = z.object({
  headline: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  discountKind: z.enum(["flat_cents", "percent_bps"]).optional(),
  discountValue: z.number().int().nonnegative().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  active: z.boolean().optional(),
  showOnAccept: z.boolean().optional(),
  showOnSite: z.boolean().optional(),
});

export const PATCH = withCors(async (req) => {
  try {
    await requireAdmin();
    const id = new URL(req.url).pathname.split("/").pop();
    if (!id) return json({ error: "Missing id" }, { status: 400 });
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });
    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.startsAt) data.startsAt = new Date(parsed.data.startsAt);
    if (parsed.data.endsAt !== undefined) data.endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : null;
    const promo = await prisma.promotion.update({ where: { id }, data });
    return json({ promotion: promo });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const DELETE = withCors(async (req) => {
  try {
    await requireAdmin();
    const id = new URL(req.url).pathname.split("/").pop();
    if (!id) return json({ error: "Missing id" }, { status: 400 });
    await prisma.promotion.delete({ where: { id } });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
