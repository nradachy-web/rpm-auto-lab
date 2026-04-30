import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export const GET = withCors(async (req) => {
  try {
    const admin = await requireAdmin();
    const id = new URL(req.url).pathname.split("/").pop();
    if (!id) return json({ error: "Missing thread id" }, { status: 400 });
    const thread = await prisma.messageThread.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!thread) return json({ error: "Not found" }, { status: 404 });
    const messages = await prisma.message.findMany({
      where: { threadId: id },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: { attachments: true },
    });
    await prisma.messageThread.update({
      where: { id },
      data: { adminLastReadAt: new Date() },
    });
    return json({ thread, messages, admin: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

const sendSchema = z.object({ body: z.string().min(1).max(4000) });

export const POST = withCors(async (req) => {
  try {
    const admin = await requireAdmin();
    const id = new URL(req.url).pathname.split("/").pop();
    if (!id) return json({ error: "Missing thread id" }, { status: 400 });
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });
    const message = await prisma.message.create({
      data: {
        threadId: id,
        sender: "admin",
        authorUserId: admin.id,
        body: parsed.data.body,
      },
    });
    await prisma.messageThread.update({
      where: { id },
      data: { lastMessageAt: new Date(), adminLastReadAt: new Date() },
    });
    return json({ message });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
