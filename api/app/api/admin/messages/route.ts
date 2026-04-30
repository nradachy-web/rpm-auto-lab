import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export const GET = withCors(async () => {
  try {
    await requireAdmin();
    const threads = await prisma.messageThread.findMany({
      orderBy: { lastMessageAt: "desc" },
      take: 200,
      include: {
        customer: { select: { id: true, email: true, name: true, phone: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    // Compute unread counts in batch
    const threadIds = threads.map((t) => t.id);
    const unreadCounts = await prisma.message.groupBy({
      by: ["threadId"],
      where: {
        threadId: { in: threadIds },
        sender: "customer",
        OR: threads.map((t) => ({
          threadId: t.id,
          createdAt: { gt: t.adminLastReadAt ?? new Date(0) },
        })),
      },
      _count: { _all: true },
    });
    const unreadMap = new Map(unreadCounts.map((u) => [u.threadId, u._count._all]));
    const enriched = threads.map((t) => ({ ...t, unreadCount: unreadMap.get(t.id) ?? 0 }));
    return json({ threads: enriched });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
