import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  scheduledAt: z.string().datetime().nullable(),
});

export const PATCH = withCors(async (req) => {
  try {
    await requireAdmin();
    const id = new URL(req.url).pathname.split("/").slice(-2, -1)[0];
    if (!id) return json({ error: "Missing job id" }, { status: 400 });
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });

    const updated = await prisma.job.update({
      where: { id },
      data: { scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null },
      include: { user: { select: { email: true, name: true } }, vehicle: true },
    });
    return json({ job: updated });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
