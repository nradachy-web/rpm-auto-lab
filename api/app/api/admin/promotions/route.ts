import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const createSchema = z.object({
  code: z.string().min(1).max(40).optional(),
  headline: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  discountKind: z.enum(["flat_cents", "percent_bps"]).default("percent_bps"),
  discountValue: z.number().int().nonnegative(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  showOnAccept: z.boolean().optional(),
  showOnSite: z.boolean().optional(),
});

export const GET = withCors(async () => {
  try {
    await requireAdmin();
    const promotions = await prisma.promotion.findMany({ orderBy: { createdAt: "desc" } });
    return json({ promotions });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const POST = withCors(async (req) => {
  try {
    await requireAdmin();
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    const promo = await prisma.promotion.create({
      data: {
        ...parsed.data,
        startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : new Date(),
        endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
      },
    });
    return json({ promotion: promo });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
