import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(40).nullable().optional(),
  smsConsent: z.boolean().optional(),
  pushConsent: z.boolean().optional(),
});

export const GET = withCors(async () => {
  const user = await currentUser();
  if (!user) return json({ error: "UNAUTHENTICATED" }, { status: 401 });
  return json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      smsConsent: user.smsConsent,
      pushConsent: user.pushConsent,
      referralCode: user.referralCode,
    },
  });
});

export const PATCH = withCors(async (req) => {
  const user = await currentUser();
  if (!user) return json({ error: "UNAUTHENTICATED" }, { status: 401 });
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
  });
  return json({ user: { id: updated.id, smsConsent: updated.smsConsent, pushConsent: updated.pushConsent, phone: updated.phone, name: updated.name, referralCode: updated.referralCode } });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
