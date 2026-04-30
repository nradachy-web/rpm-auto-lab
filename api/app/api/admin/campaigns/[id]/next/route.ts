import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Returns the next batch of unsent recipients with the customer details so
// the admin browser can fire emails via Web3Forms. Defaults to 10/batch.
export const GET = withCors(async (req) => {
  try {
    await requireAdmin();
    const segs = new URL(req.url).pathname.split("/");
    const id = segs[segs.length - 2];
    if (!id) return json({ error: "Missing campaign id" }, { status: 400 });
    const limit = Math.min(50, Math.max(1, Number(new URL(req.url).searchParams.get("limit")) || 10));
    const recipients = await prisma.campaignRecipient.findMany({
      where: { campaignId: id, sentAt: null, failedAt: null },
      take: limit,
      include: { campaign: true },
    });
    if (recipients.length === 0) return json({ recipients: [], campaign: null });
    const userIds = recipients.map((r) => r.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    });
    const enriched = recipients.map((r) => ({
      id: r.id,
      user: users.find((u) => u.id === r.userId) ?? null,
    }));
    return json({ recipients: enriched, campaign: recipients[0].campaign });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
