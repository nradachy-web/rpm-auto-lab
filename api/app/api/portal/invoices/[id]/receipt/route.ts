import { withCors } from "@/lib/cors";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildInvoicePdf } from "@/lib/pdf";

export const runtime = "nodejs";

export const GET = withCors(async (req) => {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const segs = new URL(req.url).pathname.split("/");
  const id = segs[segs.length - 2];
  if (!id) return new Response("Missing id", { status: 400 });
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      user: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      job: { include: { vehicle: true } },
    },
  });
  if (!invoice) return new Response("Not found", { status: 404 });
  if (user.role !== "admin" && invoice.userId !== user.id) return new Response("Forbidden", { status: 403 });
  const bytes = await buildInvoicePdf({
    number: invoice.number,
    createdAt: invoice.createdAt,
    user: { name: invoice.user.name, email: invoice.user.email, phone: invoice.user.phone },
    vehicle: invoice.job?.vehicle ?? null,
    lineItems: invoice.lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitCents: li.unitCents,
      totalCents: li.totalCents,
    })),
    subtotalCents: invoice.subtotalCents,
    discountCents: invoice.discountCents,
    taxRateBps: invoice.taxRateBps,
    taxCents: invoice.taxCents,
    totalCents: invoice.totalCents,
    paidCents: invoice.paidCents,
    balanceCents: invoice.balanceCents,
  });
  return new Response(bytes as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
    },
  });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
