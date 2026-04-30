import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findSegment } from "@/lib/segments";

export const runtime = "nodejs";

const create = z.object({
  name: z.string().min(1).max(120),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(8000),
  segment: z.object({
    hasService: z.string().optional(),
    noVisitForDays: z.number().int().nonnegative().optional(),
    minLifetimeCents: z.number().int().nonnegative().optional(),
  }),
});

export const GET = withCors(async () => {
  try {
    await requireAdmin();
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { _count: { select: { recipients: true } } },
    });
    return json({ campaigns });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const POST = withCors(async (req) => {
  try {
    await requireAdmin();
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = create.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });

    const userIds = await findSegment(parsed.data.segment);
    const campaign = await prisma.campaign.create({
      data: {
        name: parsed.data.name,
        subject: parsed.data.subject,
        body: parsed.data.body,
        segmentJson: parsed.data.segment,
        recipients: {
          create: userIds.map((userId) => ({ userId })),
        },
      },
      include: { _count: { select: { recipients: true } } },
    });
    return json({ campaign });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
