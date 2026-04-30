import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { nextInvoiceNumber, recomputeInvoice } from "@/lib/invoicing";

export const runtime = "nodejs";

// Auto-create an invoice from a job. One line item per service in the job
// using the catalog's price for the vehicle's size tier (or basePrice).
export const POST = withCors(async (req) => {
  try {
    await requireAdmin();
    const id = new URL(req.url).pathname.split("/").slice(-2, -1)[0];
    if (!id) return json({ error: "Missing job id" }, { status: 400 });

    const job = await prisma.job.findUnique({
      where: { id },
      include: { vehicle: true, user: true, invoice: true },
    });
    if (!job) return json({ error: "Job not found" }, { status: 404 });
    if (job.invoiceId && job.invoice) {
      return json({ invoice: job.invoice, alreadyExists: true });
    }

    const settings = await prisma.shopSettings.findFirst();
    const taxRateBps = settings?.taxRateBps ?? 600;

    const packages = await prisma.servicePackage.findMany({
      where: { slug: { in: job.services } },
      include: { pricing: true },
    });

    const tier = job.vehicle.sizeTier;
    const lineItems = job.services.map((slug, i) => {
      const pkg = packages.find((p) => p.slug === slug);
      const tierPrice = tier && pkg ? pkg.pricing.find((p) => p.sizeTier === tier)?.price : undefined;
      const dollars = tierPrice ?? pkg?.basePrice ?? 0;
      return {
        description: pkg?.name ?? slug,
        quantity: 1,
        unitCents: dollars * 100,
        totalCents: dollars * 100,
        packageId: pkg?.id,
        sortOrder: i,
      };
    });

    let attempt = 0;
    while (attempt++ < 5) {
      const number = await nextInvoiceNumber();
      try {
        const invoice = await prisma.invoice.create({
          data: {
            userId: job.userId,
            number,
            taxRateBps,
            lineItems: { create: lineItems },
          },
        });
        await prisma.job.update({ where: { id: job.id }, data: { invoiceId: invoice.id } });
        const fresh = await recomputeInvoice(invoice.id);
        return json({ invoice: fresh });
      } catch (e: unknown) {
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
