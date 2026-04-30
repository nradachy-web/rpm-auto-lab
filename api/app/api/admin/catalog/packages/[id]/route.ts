import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const tierSchema = z.object({
  sizeTier: z.enum(["compact", "sedan", "suv", "truck", "oversize"]),
  price: z.number().int().nonnegative(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  shortDesc: z.string().max(280).nullable().optional(),
  longDesc: z.string().max(4000).nullable().optional(),
  basePrice: z.number().int().nonnegative().optional(),
  defaultDurationMinutes: z.number().int().positive().optional(),
  active: z.boolean().optional(),
  pricing: z.array(tierSchema).optional(),
});

export const PATCH = withCors(async (req) => {
  try {
    await requireAdmin();
    const id = new URL(req.url).pathname.split("/").pop();
    if (!id) return json({ error: "Missing id" }, { status: 400 });

    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });

    const { pricing, ...packageUpdate } = parsed.data;

    const updated = await prisma.servicePackage.update({
      where: { id },
      data: packageUpdate,
    });

    if (pricing) {
      // Replace tier pricing wholesale to keep the API simple.
      await prisma.servicePricing.deleteMany({ where: { packageId: id } });
      if (pricing.length > 0) {
        await prisma.servicePricing.createMany({
          data: pricing.map((p) => ({ packageId: id, sizeTier: p.sizeTier, price: p.price })),
        });
      }
    }

    const fresh = await prisma.servicePackage.findUnique({
      where: { id: updated.id },
      include: { pricing: true },
    });
    return json({ package: fresh });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
