import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const patch = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  totalPrice: z.number().int().nonnegative().optional(),
  durationMinutes: z.number().int().positive().optional(),
  active: z.boolean().optional(),
  packageSlugs: z.array(z.string()).optional(),
});

export const PATCH = withCors(async (req) => {
  try {
    await requireAdmin();
    const id = new URL(req.url).pathname.split("/").pop();
    if (!id) return json({ error: "Missing id" }, { status: 400 });
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = patch.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });
    const { packageSlugs, ...rest } = parsed.data;
    await prisma.jobTemplate.update({ where: { id }, data: rest });
    if (packageSlugs) {
      await prisma.jobTemplateService.deleteMany({ where: { templateId: id } });
      const packages = await prisma.servicePackage.findMany({ where: { slug: { in: packageSlugs } } });
      if (packages.length > 0) {
        await prisma.jobTemplateService.createMany({
          data: packages.map((p) => ({ templateId: id, packageId: p.id })),
          skipDuplicates: true,
        });
      }
    }
    const fresh = await prisma.jobTemplate.findUnique({
      where: { id },
      include: { services: { include: { package: true } } },
    });
    return json({ template: fresh });
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
    await prisma.jobTemplate.update({ where: { id }, data: { active: false } });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
