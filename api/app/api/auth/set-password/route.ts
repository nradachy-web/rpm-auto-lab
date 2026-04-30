import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { getSession, sealSessionToken } from "@/lib/session";

export const runtime = "nodejs";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const POST = withCors(async (req) => {
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }
  const { token, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { setPasswordToken: token } });
  if (!user) return json({ error: "Invalid or expired token" }, { status: 400 });
  if (user.setPasswordTokenExpiry && user.setPasswordTokenExpiry < new Date()) {
    return json({ error: "This link has expired. Contact the shop to get a new one." }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      setPasswordToken: null,
      setPasswordTokenExpiry: null,
      emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
    },
  });

  const session = await getSession();
  session.userId = updated.id;
  session.role = updated.role;
  await session.save();

  const tokenOut = await sealSessionToken({ userId: updated.id, role: updated.role });
  return json({
    user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role },
    token: tokenOut,
  });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
