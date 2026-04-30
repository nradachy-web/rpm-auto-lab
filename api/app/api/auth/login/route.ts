import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { getSession, sealSessionToken } from "@/lib/session";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email().transform((s) => s.toLowerCase().trim()),
  password: z.string().min(1),
});

// Dead-simple in-memory rate limiter (5 attempts / 10 min per email+ip).
// Fine for a single-instance serverless function; swap to Upstash if we
// ever scale beyond one region.
const ATTEMPTS = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

function hit(key: string): boolean {
  const now = Date.now();
  const rec = ATTEMPTS.get(key);
  if (!rec || rec.resetAt < now) {
    ATTEMPTS.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (rec.count >= LIMIT) return false;
  rec.count++;
  return true;
}

export const POST = withCors(async (req) => {
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ error: "Invalid credentials" }, { status: 400 });
  const { email, password } = parsed.data;

  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  if (!hit(`${email}|${ip}`)) {
    return json({ error: "Too many login attempts. Try again in a few minutes." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Opaque error to avoid leaking which emails exist.
  const genericError = json({ error: "Invalid email or password" }, { status: 401 });
  if (!user || !user.passwordHash) return genericError;

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return genericError;

  const session = await getSession();
  session.userId = user.id;
  session.role = user.role;
  await session.save();

  // Also issue a bearer token so mobile browsers that block third-party
  // cookies (iOS Safari etc.) still have a working auth path.
  const token = await sealSessionToken({ userId: user.id, role: user.role });

  return json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
