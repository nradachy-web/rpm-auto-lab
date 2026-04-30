import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  status: z.enum(["sent", "failed"]),
  error: z.string().max(500).optional(),
});

export const PATCH = withCors(async (req) => {
  try {
    await requireAdmin();
    const segs = new URL(req.url).pathname.split("/");
    const recipientId = segs[segs.length - 1];
    const campaignId = segs[segs.length - 3];
    if (!recipientId || !campaignId) return json({ error: "Missing id" }, { status: 400 });
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });
    await prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: parsed.data.status === "sent"
        ? { sentAt: new Date() }
        : { failedAt: new Date(), errorText: parsed.data.error ?? null },
    });
    // If we sent the last unsent recipient, mark the campaign as sent.
    const remaining = await prisma.campaignRecipient.count({
      where: { campaignId, sentAt: null, failedAt: null },
    });
    if (remaining === 0) {
      await prisma.campaign.update({ where: { id: campaignId }, data: { status: "sent", sentAt: new Date() } });
    } else {
      await prisma.campaign.update({ where: { id: campaignId }, data: { status: "sending" } });
    }
    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
