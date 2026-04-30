import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  jobId: z.string().min(1).optional(),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(2000).optional(),
});

export const POST = withCors(async (req) => {
  const user = await currentUser();
  if (!user) return json({ error: "UNAUTHENTICATED" }, { status: 401 });
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });

  const review = await prisma.review.create({
    data: {
      userId: user.id,
      jobId: parsed.data.jobId,
      rating: parsed.data.rating,
      body: parsed.data.body,
      publishedAt: new Date(),
    },
  });
  if (parsed.data.jobId) {
    await prisma.reviewRequest.updateMany({
      where: { userId: user.id, jobId: parsed.data.jobId, respondedAt: null },
      data: { respondedAt: new Date() },
    });
  }
  await prisma.adminNotification.create({
    data: {
      kind: "review_received",
      title: `${parsed.data.rating}-star review from ${user.name}`,
      body: parsed.data.body?.slice(0, 200) ?? null,
      href: "/portal/admin/reviews",
    },
  });
  return json({ ok: true, review });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
