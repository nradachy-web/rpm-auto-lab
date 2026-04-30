import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  unit: z.string().min(1).max(40).optional(),
  lowStockAt: z.number().nonnegative().nullable().optional(),
  costCents: z.number().int().nonnegative().nullable().optional(),
  active: z.boolean().optional(),
});

const txSchema = z.object({
  delta: z.number(),
  reason: z.enum(["job_use", "restock", "adjustment", "loss", "return_to_vendor"]),
  jobId: z.string().optional(),
  note: z.string().max(280).optional(),
});

export const PATCH = withCors(async (req) => {
  try {
    await requireAdmin();
    const id = new URL(req.url).pathname.split("/").pop();
    if (!id) return json({ error: "Missing id" }, { status: 400 });
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }

    // Two modes: regular field patch, or a transaction (delta) recording.
    if (body && typeof body === "object" && "delta" in body) {
      const parsed = txSchema.safeParse(body);
      if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });
      const item = await prisma.inventoryItem.findUnique({ where: { id } });
      if (!item) return json({ error: "Not found" }, { status: 404 });
      await prisma.$transaction([
        prisma.inventoryTransaction.create({
          data: {
            itemId: id,
            delta: parsed.data.delta,
            reason: parsed.data.reason,
            jobId: parsed.data.jobId,
            note: parsed.data.note,
          },
        }),
        prisma.inventoryItem.update({
          where: { id },
          data: { quantity: { increment: parsed.data.delta } },
        }),
      ]);
      const fresh = await prisma.inventoryItem.findUnique({
        where: { id },
        include: { transactions: { orderBy: { createdAt: "desc" }, take: 10 } },
      });
      // Low-stock notification
      if (fresh && fresh.lowStockAt != null && fresh.quantity <= fresh.lowStockAt) {
        await prisma.adminNotification.create({
          data: {
            kind: "inventory_low",
            title: `Low stock: ${fresh.name}`,
            body: `${fresh.quantity} ${fresh.unit} remaining (threshold ${fresh.lowStockAt})`,
            href: "/portal/admin/inventory",
          },
        });
      }
      return json({ item: fresh });
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });
    const item = await prisma.inventoryItem.update({ where: { id }, data: parsed.data });
    return json({ item });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
