import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { nextInvoiceNumber, recomputeInvoice } from "@/lib/invoicing";

export const runtime = "nodejs";

const createSchema = z.object({
  userId: z.string().min(1),
  jobId: z.string().min(1).optional(),
  notes: z.string().max(2000).optional(),
  taxRateBps: z.number().int().min(0).max(2500).optional(),
  lineItems: z.array(z.object({
    description: z.string().min(1).max(280),
    quantity: z.number().int().positive(),
    unitCents: z.number().int().nonnegative(),
    packageId: z.string().optional(),
  })).optional(),
});

export const GET = withCors(async (req) => {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const where = status ? { status: status as never } : {};
    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { id: true, email: true, name: true, phone: true } },
        job: { select: { id: true, vehicle: { select: { id: true, year: true, make: true, model: true } } } },
        lineItems: { orderBy: { sortOrder: "asc" } },
      },
    });
    return json({ invoices });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const POST = withCors(async (req) => {
  try {
    const settings = await prisma.shopSettings.findFirst();
    const defaultTax = settings?.taxRateBps ?? 600;

    await requireAdmin();
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });

    let attempt = 0;
    while (attempt++ < 5) {
      const number = await nextInvoiceNumber();
      try {
        const invoice = await prisma.invoice.create({
          data: {
            userId: parsed.data.userId,
            number,
            notes: parsed.data.notes,
            taxRateBps: parsed.data.taxRateBps ?? defaultTax,
            lineItems: parsed.data.lineItems ? {
              create: parsed.data.lineItems.map((li, i) => ({
                description: li.description,
                quantity: li.quantity,
                unitCents: li.unitCents,
                totalCents: li.unitCents * li.quantity,
                packageId: li.packageId,
                sortOrder: i,
              })),
            } : undefined,
          },
        });
        // Link to job if provided
        if (parsed.data.jobId) {
          await prisma.job.update({ where: { id: parsed.data.jobId }, data: { invoiceId: invoice.id } });
        }
        const fresh = await recomputeInvoice(invoice.id);
        return json({ invoice: fresh });
      } catch (e: unknown) {
        // Unique constraint on number — retry with next number.
        if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") continue;
        throw e;
      }
    }
    return json({ error: "Could not allocate invoice number" }, { status: 500 });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
