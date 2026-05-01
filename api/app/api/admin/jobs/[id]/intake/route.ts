import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  mileage: z.number().int().nonnegative().nullable().optional(),
  fuelLevelEighths: z.number().int().min(0).max(8).nullable().optional(),
  keyCount: z.number().int().min(0).max(10).nullable().optional(),
  customerNotes: z.string().max(2000).nullable().optional(),
  shopNotes: z.string().max(2000).nullable().optional(),
  signatureDataUrl: z.string().nullable().optional(),
  signedByName: z.string().max(120).nullable().optional(),
  signedAt: z.string().datetime().nullable().optional(),
});

function jobId(req: Request) {
  const segs = new URL(req.url).pathname.split("/");
  return segs[segs.length - 2];
}

export const GET = withCors(async (req) => {
  try {
    await requireAdmin();
    const id = jobId(req);
    if (!id) return json({ error: "Missing job id" }, { status: 400 });
    const intake = await prisma.intakeForm.findUnique({ where: { jobId: id } });
    return json({ intake });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const POST = withCors(async (req) => {
  try {
    await requireAdmin();
    const id = jobId(req);
    if (!id) return json({ error: "Missing job id" }, { status: 400 });
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });

    const data = {
      mileage: parsed.data.mileage,
      fuelLevelEighths: parsed.data.fuelLevelEighths,
      keyCount: parsed.data.keyCount,
      customerNotes: parsed.data.customerNotes,
      shopNotes: parsed.data.shopNotes,
      signatureDataUrl: parsed.data.signatureDataUrl,
      signedByName: parsed.data.signedByName,
      signedAt: parsed.data.signedAt ? new Date(parsed.data.signedAt) : null,
    };

    const intake = await prisma.intakeForm.upsert({
      where: { jobId: id },
      create: { jobId: id, ...data },
      update: data,
    });
    return json({ intake });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
