import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const create = z.object({
  name: z.string().min(1).max(120),
  unit: z.string().min(1).max(40).default("unit"),
  quantity: z.number().nonnegative().default(0),
  lowStockAt: z.number().nonnegative().nullable().optional(),
  costCents: z.number().int().nonnegative().nullable().optional(),
});

export const GET = withCors(async () => {
  try {
    await requireAdmin();
    const items = await prisma.inventoryItem.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 5 } },
    });
    return json({ items });
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
    const parsed = create.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    const item = await prisma.inventoryItem.create({ data: parsed.data });
    return json({ item });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
