import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

async function ensureThread(customerId: string) {
  const existing = await prisma.messageThread.findUnique({ where: { customerId } });
  if (existing) return existing;
  return prisma.messageThread.create({ data: { customerId } });
}

export const GET = withCors(async () => {
  const user = await currentUser();
  if (!user) return json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const thread = await ensureThread(user.id);
  const messages = await prisma.message.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { attachments: true },
  });
  // Mark as read by customer.
  await prisma.messageThread.update({
    where: { id: thread.id },
    data: { customerLastReadAt: new Date() },
  });
  return json({ thread, messages });
});

const sendSchema = z.object({ body: z.string().min(1).max(4000) });

export const POST = withCors(async (req) => {
  const user = await currentUser();
  if (!user) return json({ error: "UNAUTHENTICATED" }, { status: 401 });
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });
  const thread = await ensureThread(user.id);
  const message = await prisma.message.create({
    data: {
      threadId: thread.id,
      sender: "customer",
      authorUserId: user.id,
      body: parsed.data.body,
    },
  });
  await prisma.messageThread.update({
    where: { id: thread.id },
    data: { lastMessageAt: new Date(), customerLastReadAt: new Date() },
  });
  await prisma.adminNotification.create({
    data: {
      kind: "new_message",
      title: `Message from ${user.name}`,
      body: parsed.data.body.slice(0, 200),
      href: `/portal/admin/messages?thread=${thread.id}`,
    },
  });
  return json({ message });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
