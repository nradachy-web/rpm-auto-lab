import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recomputeInvoice } from "@/lib/invoicing";

export const runtime = "nodejs";

const patchSchema = z.object({
  description: z.string().min(1).max(280).optional(),
  quantity: z.number().int().positive().optional(),
  unitCents: z.number().int().nonnegative().optional(),
});

function parseUrl(req: Request) {
  const segs = new URL(req.url).pathname.split("/");
  const itemId = segs[segs.length - 1];
  const invoiceId = segs[segs.length - 3];
  return { invoiceId, itemId };
}

export const PATCH = withCors(async (req) => {
  try {
    await requireAdmin();
    const { invoiceId, itemId } = parseUrl(req);
    if (!itemId || !invoiceId) return json({ error: "Missing id" }, { status: 400 });
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });
    const existing = await prisma.invoiceLineItem.findUnique({ where: { id: itemId } });
    if (!existing) return json({ error: "Line item not found" }, { status: 404 });
    const next = {
      description: parsed.data.description ?? existing.description,
      quantity: parsed.data.quantity ?? existing.quantity,
      unitCents: parsed.data.unitCents ?? existing.unitCents,
    };
    await prisma.invoiceLineItem.update({
      where: { id: itemId },
      data: { ...next, totalCents: next.unitCents * next.quantity },
    });
    const invoice = await recomputeInvoice(invoiceId);
    return json({ invoice });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const DELETE = withCors(async (req) => {
  try {
    await requireAdmin();
    const { invoiceId, itemId } = parseUrl(req);
    if (!itemId || !invoiceId) return json({ error: "Missing id" }, { status: 400 });
    await prisma.invoiceLineItem.delete({ where: { id: itemId } });
    const invoice = await recomputeInvoice(invoiceId);
    return json({ invoice });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
