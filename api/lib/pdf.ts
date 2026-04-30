import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface InvoiceForPdf {
  number: string;
  createdAt: Date;
  user: { name: string; email: string; phone?: string | null };
  vehicle?: { year: number; make: string; model: string; trim?: string | null } | null;
  lineItems: { description: string; quantity: number; unitCents: number; totalCents: number }[];
  subtotalCents: number;
  discountCents: number;
  taxRateBps: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  balanceCents: number;
}

const $ = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export async function buildInvoicePdf(invoice: InvoiceForPdf): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]); // US Letter
  const { width } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.1, 0.1, 0.1);
  const muted = rgb(0.45, 0.45, 0.45);
  const accent = rgb(0.86, 0.15, 0.15);

  let y = 750;

  page.drawText("RPM Auto Lab", { x: 40, y, size: 18, font: bold, color: ink });
  page.drawText("4581 S Lapeer Rd, Suite G, Orion Township, MI 48359", { x: 40, y: y - 14, size: 9, font, color: muted });
  page.drawText("rpmautolab.com", { x: 40, y: y - 26, size: 9, font, color: muted });

  page.drawText(`Invoice ${invoice.number}`, { x: width - 200, y, size: 14, font: bold, color: accent });
  page.drawText(`Issued ${invoice.createdAt.toLocaleDateString()}`, { x: width - 200, y: y - 14, size: 9, font, color: muted });

  y -= 60;
  page.drawText("Bill to", { x: 40, y, size: 9, font: bold, color: muted });
  y -= 14;
  page.drawText(invoice.user.name, { x: 40, y, size: 11, font: bold, color: ink });
  y -= 12;
  page.drawText(invoice.user.email, { x: 40, y, size: 9, font, color: muted });
  if (invoice.user.phone) {
    y -= 12;
    page.drawText(invoice.user.phone, { x: 40, y, size: 9, font, color: muted });
  }
  if (invoice.vehicle) {
    y -= 16;
    page.drawText("Vehicle", { x: 40, y, size: 9, font: bold, color: muted });
    y -= 12;
    page.drawText(`${invoice.vehicle.year} ${invoice.vehicle.make} ${invoice.vehicle.model}${invoice.vehicle.trim ? " " + invoice.vehicle.trim : ""}`, { x: 40, y, size: 10, font, color: ink });
  }

  y -= 30;
  page.drawText("Description", { x: 40, y, size: 9, font: bold, color: muted });
  page.drawText("Qty", { x: 360, y, size: 9, font: bold, color: muted });
  page.drawText("Unit", { x: 410, y, size: 9, font: bold, color: muted });
  page.drawText("Total", { x: width - 80, y, size: 9, font: bold, color: muted });
  y -= 6;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: muted });
  y -= 14;

  for (const li of invoice.lineItems) {
    page.drawText(li.description, { x: 40, y, size: 10, font, color: ink, maxWidth: 300 });
    page.drawText(String(li.quantity), { x: 360, y, size: 10, font, color: ink });
    page.drawText($(li.unitCents), { x: 410, y, size: 10, font, color: ink });
    page.drawText($(li.totalCents), { x: width - 80, y, size: 10, font, color: ink });
    y -= 16;
  }

  y -= 8;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: muted });
  y -= 14;

  const totals: { label: string; value: string; bold?: boolean; color?: ReturnType<typeof rgb> }[] = [
    { label: "Subtotal", value: $(invoice.subtotalCents) },
    { label: "Discount", value: `−${$(invoice.discountCents)}` },
    { label: `Tax (${(invoice.taxRateBps / 100).toFixed(2)}%)`, value: $(invoice.taxCents) },
    { label: "Total", value: $(invoice.totalCents), bold: true },
    { label: "Paid", value: $(invoice.paidCents) },
    { label: "Balance", value: $(invoice.balanceCents), bold: true, color: invoice.balanceCents > 0 ? accent : ink },
  ];
  for (const t of totals) {
    page.drawText(t.label, { x: 360, y, size: 10, font: t.bold ? bold : font, color: t.color ?? ink });
    page.drawText(t.value, { x: width - 80, y, size: 10, font: t.bold ? bold : font, color: t.color ?? ink });
    y -= 14;
  }

  page.drawText("Thank you for your business — RPM Auto Lab", {
    x: 40, y: 40, size: 9, font, color: muted,
  });

  return pdf.save();
}
