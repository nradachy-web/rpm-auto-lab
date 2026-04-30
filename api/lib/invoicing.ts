import { prisma } from "./db";

// Recompute and persist subtotal/tax/total/paid/balance from current line items
// and payments. Always run after any mutation to line items or payments so the
// stored totals match. Returns the updated invoice.
export async function recomputeInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lineItems: true, payments: true },
  });
  if (!invoice) throw new Error("Invoice not found");

  const subtotalCents = invoice.lineItems.reduce((s, li) => s + li.totalCents, 0);
  const discountCents = invoice.discountCents;
  const taxableCents = Math.max(0, subtotalCents - discountCents);
  const taxCents = Math.round((taxableCents * invoice.taxRateBps) / 10000);
  const totalCents = taxableCents + taxCents;
  const paidCents = invoice.payments.reduce((s, p) => s + p.amountCents, 0);
  const balanceCents = totalCents - paidCents;

  let status = invoice.status;
  if (paidCents <= 0) status = invoice.issuedAt ? "sent" : "draft";
  else if (paidCents >= totalCents) status = "paid";
  else status = "partial";

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { subtotalCents, taxCents, totalCents, paidCents, balanceCents, status, paidAt: paidCents >= totalCents && totalCents > 0 ? new Date() : null },
    include: { lineItems: { orderBy: { sortOrder: "asc" } }, payments: { orderBy: { receivedAt: "desc" } } },
  });
}

// Generate the next invoice number. Uses a count-based scheme; collisions
// (rare under low volume) are caught by the @unique constraint at insert time
// and we retry with the next number.
export async function nextInvoiceNumber(): Promise<string> {
  const count = await prisma.invoice.count();
  const padded = String(count + 1).padStart(4, "0");
  return `INV-${padded}`;
}
