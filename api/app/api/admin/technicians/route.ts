import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  initials: z.string().max(6).optional(),
  userId: z.string().min(1).optional(),
});

export const GET = withCors(async () => {
  try {
    await requireAdmin();
    const technicians = await prisma.technician.findMany({
      orderBy: { name: "asc" },
      include: { user: { select: { id: true, email: true, name: true, role: true } } },
    });
    return json({ technicians });
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
    const tech = await prisma.technician.create({ data: parsed.data });
    return json({ technician: tech });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
