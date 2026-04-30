import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  vehicleId: z.string().min(1),
  services: z.array(z.string()).min(1),
});

export const POST = withCors(async (req) => {
  try {
    await requireAdmin();
    if (!process.env.ANTHROPIC_API_KEY) {
      return json({ error: "AI not configured. Set ANTHROPIC_API_KEY in Vercel." }, { status: 503 });
    }
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });

    const vehicle = await prisma.vehicle.findUnique({ where: { id: parsed.data.vehicleId } });
    if (!vehicle) return json({ error: "Vehicle not found" }, { status: 404 });

    // Pull comparable past jobs for context.
    const recentJobs = await prisma.job.findMany({
      where: {
        services: { hasSome: parsed.data.services },
        completedAt: { not: null },
      },
      orderBy: { completedAt: "desc" },
      take: 12,
      include: {
        vehicle: true,
        invoice: { select: { totalCents: true, paidCents: true } },
        quote: { select: { quotedAmount: true, estimatedTotal: true } },
      },
    });
    const packages = await prisma.servicePackage.findMany({
      where: { slug: { in: parsed.data.services } },
      include: { pricing: true },
    });

    const context = {
      target: {
        vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? " " + vehicle.trim : ""}`,
        sizeTier: vehicle.sizeTier,
        services: parsed.data.services,
      },
      catalog: packages.map((p) => ({
        slug: p.slug,
        name: p.name,
        basePrice: p.basePrice,
        pricing: p.pricing.map((t) => ({ tier: t.sizeTier, price: t.price })),
      })),
      comparables: recentJobs.map((j) => ({
        vehicle: `${j.vehicle.year} ${j.vehicle.make} ${j.vehicle.model}`,
        services: j.services,
        priceDollars: j.invoice ? Math.round(j.invoice.totalCents / 100) : (j.quote?.quotedAmount ?? j.quote?.estimatedTotal ?? null),
      })),
    };

    const prompt = `You price detailing/PPF/coating jobs for a high-end auto lab.

Suggest a final quote in whole dollars and a one-sentence rationale. Be conservative if comparables disagree, and round to a clean number. Use the size-tier price as a baseline and adjust for vehicle complexity.

Context (JSON): ${JSON.stringify(context, null, 2)}

Reply ONLY as JSON: {"price": <integer dollars>, "rationale": "<one sentence>"}`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!aiRes.ok) {
      const text = await aiRes.text().catch(() => "");
      return json({ error: `AI ${aiRes.status}: ${text.slice(0, 200)}` }, { status: 502 });
    }
    const aiBody = await aiRes.json() as { content?: { text?: string }[] };
    const text = aiBody.content?.[0]?.text ?? "";
    let suggestion: { price: number; rationale: string } | null = null;
    try {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) suggestion = JSON.parse(m[0]);
    } catch {}
    if (!suggestion) return json({ error: "Could not parse AI response", raw: text }, { status: 502 });
    return json({ suggestion });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    const msg = e instanceof Error ? e.message : "Unknown";
    return json({ error: msg }, { status: 500 });
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
