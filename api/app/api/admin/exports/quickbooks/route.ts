import { withCors } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Returns a CSV in QuickBooks-importable format. One row per invoice line
// item with the totals on the first row of each invoice. Importable via
// QBO's "Import Invoices/Sales Receipts" wizard — Alex maps fields once.

function csvField(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v).replace(/"/g, '""');
  if (/[",\n]/.test(s)) return `"${s}"`;
  return s;
}

const HEADERS = [
  "InvoiceNo",
  "Customer",
  "Email",
  "InvoiceDate",
  "DueDate",
  "Item(Product/Service)",
  "ItemDescription",
  "ItemQuantity",
  "ItemRate",
  "ItemAmount",
  "Taxable",
  "TaxRate",
  "InvoiceSubtotal",
  "InvoiceTax",
  "InvoiceTotal",
  "InvoicePaid",
  "InvoiceBalance",
  "Memo",
];

export const GET = withCors(async (req) => {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const where: Record<string, unknown> = { status: { in: ["sent", "partial", "paid"] } };
    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
      where.createdAt = dateFilter;
    }
    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { email: true, name: true } },
        lineItems: { orderBy: { sortOrder: "asc" } },
      },
    });

    const rows: string[] = [HEADERS.map(csvField).join(",")];
    for (const inv of invoices) {
      const dollar = (c: number) => (c / 100).toFixed(2);
      const date = (inv.issuedAt ?? inv.createdAt).toISOString().slice(0, 10);
      const due = inv.dueAt ? inv.dueAt.toISOString().slice(0, 10) : "";
      let firstRow = true;
      for (const li of inv.lineItems) {
        rows.push([
          inv.number,
          inv.user.name,
          inv.user.email,
          date,
          due,
          li.description.slice(0, 60),
          li.description,
          li.quantity,
          dollar(li.unitCents),
          dollar(li.totalCents),
          inv.taxRateBps > 0 ? "Y" : "N",
          (inv.taxRateBps / 100).toFixed(2),
          firstRow ? dollar(inv.subtotalCents) : "",
          firstRow ? dollar(inv.taxCents) : "",
          firstRow ? dollar(inv.totalCents) : "",
          firstRow ? dollar(inv.paidCents) : "",
          firstRow ? dollar(inv.balanceCents) : "",
          firstRow ? (inv.notes ?? "") : "",
        ].map(csvField).join(","));
        firstRow = false;
      }
      if (inv.lineItems.length === 0) {
        rows.push([
          inv.number, inv.user.name, inv.user.email, date, due,
          "(no items)", "", 0, "0.00", "0.00", "N", "0.00",
          dollar(inv.subtotalCents), dollar(inv.taxCents), dollar(inv.totalCents), dollar(inv.paidCents), dollar(inv.balanceCents),
          inv.notes ?? "",
        ].map(csvField).join(","));
      }
    }

    const csv = rows.join("\n") + "\n";
    const fname = `rpm-invoices-${(from || "all").slice(0, 10)}-to-${(to || "now").slice(0, 10)}.csv`;
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fname}"`,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return new Response("Unauthorized", { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
