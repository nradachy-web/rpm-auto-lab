import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  threadId: z.string().min(1),
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

    const thread = await prisma.messageThread.findUnique({
      where: { id: parsed.data.threadId },
      include: {
        customer: {
          select: {
            name: true,
            jobs: {
              orderBy: { updatedAt: "desc" },
              take: 5,
              include: { vehicle: { select: { year: true, make: true, model: true } } },
            },
          },
        },
      },
    });
    if (!thread) return json({ error: "Thread not found" }, { status: 404 });

    const messages = await prisma.message.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    messages.reverse();

    const transcript = messages.map((m) => `${m.sender === "customer" ? thread.customer.name : "RPM"}: ${m.body}`).join("\n");
    const recentJobs = thread.customer.jobs.map((j) => `- ${j.vehicle.year} ${j.vehicle.make} ${j.vehicle.model}: ${j.services.join(", ")} (${j.status})`).join("\n");

    const prompt = `You are drafting a SHORT, friendly reply on behalf of RPM Auto Lab to a customer. Match the tone of an experienced shop owner who knows the customer — warm but efficient, no fluff. Two short paragraphs max. Do not invent appointments, prices, or facts not in the context. If the customer asked a question you can't answer from context, ask a brief clarifying question instead of guessing.

Customer: ${thread.customer.name}

Recent jobs:
${recentJobs || "(none)"}

Recent message thread (oldest → newest):
${transcript}

Reply as RPM. Plain text only — no greetings header.`;

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
    const suggestion = (aiBody.content?.[0]?.text ?? "").trim();
    if (!suggestion) return json({ error: "Empty AI response" }, { status: 502 });
    return json({ suggestion });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    const msg = e instanceof Error ? e.message : "Unknown";
    return json({ error: msg }, { status: 500 });
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
