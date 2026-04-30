import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recomputeInvoice } from "@/lib/invoicing";

export const runtime = "nodejs";

const updateSchema = z.object({
  notes: z.string().max(2000).nullable().optional(),
  taxRateBps: z.number().int().min(0).max(2500).optional(),
  discountCents: z.number().int().min(0).optional(),
  dueAt: z.string().datetime().nullable().optional(),
  issued: z.boolean().optional(),
  void: z.boolean().optional(),
});

export const GET = withCors(async (req) => {
  try {
    await requireAdmin();
    const id = new URL(req.url).pathname.split("/").pop();
    if (!id) return json({ error: "Missing id" }, { status: 400 });
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        user: true,
        lineItems: { orderBy: { sortOrder: "asc" } },
        payments: { orderBy: { receivedAt: "desc" } },
        job: { include: { vehicle: true } },
      },
    });
    if (!invoice) return json({ error: "Not found" }, { status: 404 });
    return json({ invoice });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const PATCH = withCors(async (req) => {
  try {
    await requireAdmin();
    const id = new URL(req.url).pathname.split("/").pop();
    if (!id) return json({ error: "Missing id" }, { status: 400 });
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });
    const data: Record<string, unknown> = {};
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
    if (parsed.data.taxRateBps !== undefined) data.taxRateBps = parsed.data.taxRateBps;
    if (parsed.data.discountCents !== undefined) data.discountCents = parsed.data.discountCents;
    if (parsed.data.dueAt !== undefined) data.dueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null;
    if (parsed.data.issued === true) {
      data.status = "sent";
      data.issuedAt = new Date();
    }
    if (parsed.data.void === true) data.status = "void";
    await prisma.invoice.update({ where: { id }, data });
    const fresh = await recomputeInvoice(id);
    return json({ invoice: fresh });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
