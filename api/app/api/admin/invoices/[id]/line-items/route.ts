import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recomputeInvoice } from "@/lib/invoicing";

export const runtime = "nodejs";

const createSchema = z.object({
  description: z.string().min(1).max(280),
  quantity: z.number().int().positive(),
  unitCents: z.number().int().nonnegative(),
  packageId: z.string().optional(),
});

export const POST = withCors(async (req) => {
  try {
    await requireAdmin();
    const invoiceId = new URL(req.url).pathname.split("/").slice(-2, -1)[0];
    if (!invoiceId) return json({ error: "Missing invoice id" }, { status: 400 });
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });
    const count = await prisma.invoiceLineItem.count({ where: { invoiceId } });
    await prisma.invoiceLineItem.create({
      data: {
        invoiceId,
        description: parsed.data.description,
        quantity: parsed.data.quantity,
        unitCents: parsed.data.unitCents,
        totalCents: parsed.data.unitCents * parsed.data.quantity,
        packageId: parsed.data.packageId,
        sortOrder: count,
      },
    });
    const invoice = await recomputeInvoice(invoiceId);
    return json({ invoice });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
