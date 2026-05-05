import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// ShopSettings is singleton-ish — we keep a single row and lazily create
// it on first access. Exposes shop name, tax rate, deposit ratio, time
// zone, business hours JSON, loyalty config, Google review URL, and
// the email signature.

async function getOrCreate() {
  const existing = await prisma.shopSettings.findFirst();
  if (existing) return existing;
  return prisma.shopSettings.create({ data: {} });
}

const patchSchema = z.object({
  shopName: z.string().min(1).max(120).optional(),
  taxRateBps: z.number().int().min(0).max(2500).optional(),
  depositRatioBps: z.number().int().min(0).max(10000).optional(),
  timeZone: z.string().max(80).optional(),
  loyaltyPointsPerDollar: z.number().int().min(0).max(50).optional(),
  loyaltyDollarsPerHundredPoints: z.number().int().min(0).max(500).optional(),
  referralRewardCents: z.number().int().min(0).max(1000000).optional(),
  googleReviewUrl: z.string().url().nullable().optional().or(z.literal("")),
  emailSignature: z.string().max(2000).nullable().optional(),
  businessHoursJson: z.record(z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() })).nullable().optional(),
});

export const GET = withCors(async () => {
  try {
    await requireAdmin();
    const settings = await getOrCreate();
    return json({ settings });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const PATCH = withCors(async (req) => {
  try {
    await requireAdmin();
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    const cur = await getOrCreate();
    const data = { ...parsed.data };
    if (data.googleReviewUrl === "") data.googleReviewUrl = null;
    const settings = await prisma.shopSettings.update({ where: { id: cur.id }, data });
    return json({ settings });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
