import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

interface Guide {
  title: string;
  intro: string;
  bullets: string[];
  warranty: string;
}

const GUIDES: Record<string, Guide> = {
  "ceramic-coating": {
    title: "Ceramic Coating Aftercare",
    intro: "Your vehicle now wears a high-grade ceramic coating. Treat it gently for the first week so the chemistry can fully cure.",
    bullets: [
      "Do NOT wash for 7 days after install.",
      "Do NOT park under heavy tree sap or birds for the first week.",
      "After 7 days, hand-wash only with pH-neutral soap.",
      "Avoid drive-through brushes — they create microscratches even on coated paint.",
      "Use the two-bucket method or rinseless wash. Microfiber towels only.",
      "Decontamination: bring it back annually for inspection + maintenance.",
    ],
    warranty: "Coverage: 5-year manufacturer warranty against UV degradation, oxidation, and loss of hydrophobicity, with annual inspection.",
  },
  "paint-protection-film": {
    title: "Paint Protection Film (PPF) Aftercare",
    intro: "Your PPF is fully cured within 48 hours. Keep these guidelines and the film will protect your paint for years.",
    bullets: [
      "Do NOT wash for 48 hours after install.",
      "Avoid pressure washing edges directly for the first 7 days.",
      "Hand-wash with pH-neutral soap. Skip chemical-strong cleaners.",
      "Do not apply waxes, polishes, or sealants over PPF without consulting us.",
      "Self-healing: light scratches will disappear with heat (sun, hot water).",
      "If an edge starts lifting, stop washing and bring it in — it's covered.",
    ],
    warranty: "Coverage: 10-year manufacturer warranty against yellowing, cracking, peeling, and bubbling.",
  },
  "window-tint": {
    title: "Window Tint Aftercare",
    intro: "Tint cures over the first few days. Bubbles you see are just water trapped during install — they will dissipate.",
    bullets: [
      "Do NOT roll windows down for 3-5 days (7+ in cold weather).",
      "Do not clean tinted windows for 7 days.",
      "After cure: only ammonia-free glass cleaner. No paper towels.",
      "Small water bubbles will fully disappear within 30 days as moisture evaporates.",
      "If you see haze that doesn't clear after a month, contact us — covered.",
    ],
    warranty: "Coverage: lifetime warranty against bubbling, peeling, fading, delamination, and adhesive failure.",
  },
  "vehicle-wraps": {
    title: "Vehicle Wrap Aftercare",
    intro: "Vinyl wraps cure over the first 24-48 hours. After that, they need slightly different care than paint.",
    bullets: [
      "Do NOT wash for 48-72 hours after install.",
      "Hand-wash only — no automatic car washes.",
      "Avoid pressure washing seams or edges.",
      "Park in shade or covered when possible — UV is the wrap's biggest enemy.",
      "Use vinyl-safe cleaners. No solvents, no degreasers, no waxes with petroleum distillates.",
    ],
    warranty: "Coverage: 5-year manufacturer warranty on color fastness and adhesion.",
  },
  "paint-correction": {
    title: "Paint Correction Aftercare",
    intro: "Your paint has been polished to a like-new finish. Without protection, defects will return — we recommend pairing with ceramic or PPF.",
    bullets: [
      "Hand-wash only — do not use automatic brushes.",
      "Use the two-bucket method with grit guards.",
      "Microfiber drying towels (no chamois, no terry cloth).",
      "Touch the paint as little as possible.",
      "Plan to add ceramic coating or PPF within 30 days to lock in the work.",
    ],
    warranty: "Paint correction itself is not warrantied — the protection layer (coating/PPF) carries the warranty.",
  },
  "detailing": {
    title: "Detailing Aftercare",
    intro: "Your interior and exterior are restored. To keep it that way:",
    bullets: [
      "Vacuum weekly — debris damages carpets and seats over time.",
      "Wipe leather monthly with a leather cleaner; condition quarterly.",
      "Use a UV protectant on dashboards to prevent cracking.",
      "Wash exterior every 2-3 weeks. Apply a spray sealant after each wash for extra gloss.",
    ],
    warranty: "Detailing services are not warrantied long-term, but if you're unhappy within 24 hours of pickup, contact us.",
  },
  "windshield-protection": {
    title: "Windshield Protection Film Aftercare",
    intro: "Your windshield is now armored. The film will cure over 48 hours.",
    bullets: [
      "Do NOT clean the windshield for 7 days.",
      "Wipers are safe to use immediately, but minimize on dry glass.",
      "Use ammonia-free glass cleaner only.",
      "Small chips that get caught by the film should be inspected — usually not visible from inside.",
    ],
    warranty: "Coverage: 2-year warranty against yellowing, peeling, or premature wear.",
  },
};

export async function buildAftercarePdf(args: {
  serviceSlug: string;
  customerName?: string;
  vehicle?: string;
  installedAt?: Date;
}): Promise<{ bytes: Uint8Array; filename: string }> {
  const guide = GUIDES[args.serviceSlug];
  if (!guide) throw new Error("No aftercare guide for service: " + args.serviceSlug);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const { width } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.1, 0.1, 0.1);
  const muted = rgb(0.45, 0.45, 0.45);
  const accent = rgb(0.86, 0.15, 0.15);

  let y = 760;
  page.drawText("RPM Auto Lab", { x: 40, y, size: 16, font: bold, color: ink });
  page.drawText("Orion Township, MI · rpmautolab.com", { x: 40, y: y - 14, size: 9, font, color: muted });

  y -= 50;
  page.drawText(guide.title, { x: 40, y, size: 22, font: bold, color: accent });
  y -= 22;
  if (args.customerName || args.vehicle) {
    page.drawText(`For ${args.customerName ?? ""}${args.vehicle ? ` · ${args.vehicle}` : ""}`, { x: 40, y, size: 10, font, color: muted });
    y -= 14;
  }
  if (args.installedAt) {
    page.drawText(`Installed ${args.installedAt.toLocaleDateString()}`, { x: 40, y, size: 9, font, color: muted });
    y -= 14;
  }

  y -= 14;
  // Word-wrap intro at ~85 chars/line
  for (const line of wrap(guide.intro, 85)) {
    page.drawText(line, { x: 40, y, size: 11, font, color: ink });
    y -= 14;
  }

  y -= 8;
  page.drawText("Care guidelines", { x: 40, y, size: 11, font: bold, color: ink });
  y -= 16;
  for (const b of guide.bullets) {
    for (const line of wrap("• " + b, 85)) {
      page.drawText(line, { x: 40, y, size: 10, font, color: ink });
      y -= 13;
    }
    y -= 4;
  }

  y -= 12;
  page.drawText("Warranty", { x: 40, y, size: 11, font: bold, color: ink });
  y -= 14;
  for (const line of wrap(guide.warranty, 85)) {
    page.drawText(line, { x: 40, y, size: 10, font, color: ink });
    y -= 13;
  }

  page.drawText("Questions? Reply to your job email or text the shop. We're happy to help.", {
    x: 40, y: 50, size: 9, font, color: muted, maxWidth: width - 80,
  });

  return {
    bytes: await pdf.save(),
    filename: `${guide.title.toLowerCase().replace(/\s+/g, "-")}.pdf`,
  };
}

function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) {
      out.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) out.push(cur);
  return out;
}
