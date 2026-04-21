import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

// One-time admin bootstrap: creates an admin user iff the caller provides the
// BOOTSTRAP_TOKEN env var and no admin exists yet. After Alex logs in once we
// can leave this endpoint up — it will refuse to run a second time.
const schema = z.object({
  token: z.string().min(10),
  email: z.string().email(),
  password: z.string().min(12),
  name: z.string().min(1).max(120),
});

export const POST = withCors(async (req) => {
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });

  const expected = process.env.BOOTSTRAP_TOKEN;
  if (!expected || parsed.data.token !== expected) {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  const anyAdmin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (anyAdmin) return json({ error: "Admin already exists" }, { status: 409 });

  const passwordHash = await hashPassword(parsed.data.password);
  const admin = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase().trim(),
      name: parsed.data.name,
      role: "admin",
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });
  return json({ ok: true, user: { id: admin.id, email: admin.email, role: admin.role } });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
