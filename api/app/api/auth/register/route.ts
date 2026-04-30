import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { getSession, sealSessionToken } from "@/lib/session";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email().transform((s) => s.toLowerCase().trim()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(120),
  phone: z.string().max(40).optional(),
});

export const POST = withCors(async (req) => {
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }
  const { email, password, name, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return json({ error: "An account with that email already exists" }, { status: 409 });
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, name, phone, passwordHash, role: "customer", emailVerifiedAt: new Date() },
  });

  const session = await getSession();
  session.userId = user.id;
  session.role = user.role;
  await session.save();

  const token = await sealSessionToken({ userId: user.id, role: user.role });
  return json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
