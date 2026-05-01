import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const patchSchema = z.object({
  notes: z.string().max(4000).nullable().optional(),
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(40).nullable().optional(),
});

export const GET = withCors(async (req) => {
  try {
    await requireAdmin();
    const id = new URL(req.url).pathname.split("/").pop();
    if (!id) return json({ error: "Missing id" }, { status: 400 });
    const customer = await prisma.user.findUnique({
      where: { id },
      include: {
        vehicles: { orderBy: { createdAt: "desc" } },
        quotes: { orderBy: { submittedAt: "desc" }, include: { vehicle: true } },
        jobs: { orderBy: { updatedAt: "desc" }, include: { vehicle: true, invoice: true } },
        invoices: { orderBy: { createdAt: "desc" }, include: { lineItems: true, payments: true } },
        loyaltyLedger: { orderBy: { createdAt: "desc" }, take: 30 },
        subscriptions: true,
      },
    });
    if (!customer) return json({ error: "Not found" }, { status: 404 });
    return json({ customer });
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
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });
    const customer = await prisma.user.update({ where: { id }, data: parsed.data });
    return json({ customer });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
