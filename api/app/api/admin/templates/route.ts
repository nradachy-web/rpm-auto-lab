import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const createSchema = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/i),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  totalPrice: z.number().int().nonnegative(),
  durationMinutes: z.number().int().positive(),
  packageSlugs: z.array(z.string()).optional(),
});

export const GET = withCors(async () => {
  try {
    await requireAdmin();
    const templates = await prisma.jobTemplate.findMany({
      orderBy: { name: "asc" },
      include: { services: { include: { package: true } } },
    });
    return json({ templates });
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

    const packages = parsed.data.packageSlugs
      ? await prisma.servicePackage.findMany({ where: { slug: { in: parsed.data.packageSlugs } } })
      : [];

    const template = await prisma.jobTemplate.create({
      data: {
        slug: parsed.data.slug,
        name: parsed.data.name,
        description: parsed.data.description,
        totalPrice: parsed.data.totalPrice,
        durationMinutes: parsed.data.durationMinutes,
        services: { create: packages.map((p) => ({ packageId: p.id })) },
      },
      include: { services: { include: { package: true } } },
    });
    return json({ template });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
