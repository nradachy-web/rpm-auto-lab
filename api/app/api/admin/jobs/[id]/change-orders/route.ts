import { z } from "zod";
import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError, generateToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendSms } from "@/lib/twilio";

export const runtime = "nodejs";

const PUBLIC_SITE = process.env.PUBLIC_ORIGIN ?? "https://nradachy-web.github.io";
const PUBLIC_BASE = PUBLIC_SITE.endsWith("/") ? `${PUBLIC_SITE}rpm-auto-lab` : `${PUBLIC_SITE}/rpm-auto-lab`;

const schema = z.object({
  description: z.string().min(1).max(280),
  unitCents: z.number().int().nonnegative(),
  quantity: z.number().int().positive().default(1),
  photoUrl: z.string().url().nullable().optional(),
  photoPathname: z.string().nullable().optional(),
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
    const orders = await prisma.changeOrder.findMany({
      where: { jobId: id },
      orderBy: { createdAt: "desc" },
    });
    return json({ changeOrders: orders });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const POST = withCors(async (req) => {
  try {
    const admin = await requireAdmin();
    const id = jobId(req);
    if (!id) return json({ error: "Missing job id" }, { status: 400 });
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return json({ error: "Validation failed" }, { status: 400 });

    const job = await prisma.job.findUnique({
      where: { id },
      include: { user: true, vehicle: true, invoice: true },
    });
    if (!job) return json({ error: "Job not found" }, { status: 404 });

    const totalCents = parsed.data.unitCents * parsed.data.quantity;
    const co = await prisma.changeOrder.create({
      data: {
        jobId: job.id,
        invoiceId: job.invoiceId,
        description: parsed.data.description,
        quantity: parsed.data.quantity,
        unitCents: parsed.data.unitCents,
        totalCents,
        photoUrl: parsed.data.photoUrl,
        photoPathname: parsed.data.photoPathname,
        approvalToken: generateToken(),
        createdByAdminId: admin.id,
      },
    });

    // Send SMS to customer with approve link, if they have a phone + consent (or
    // just phone — change orders are mid-job, customer expects updates).
    if (job.user.phone) {
      const link = `${PUBLIC_BASE}/portal/approve?token=${encodeURIComponent(co.approvalToken)}`;
      const veh = `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`;
      sendSms(
        job.user.phone,
        `RPM Auto Lab: addition needed on your ${veh} — ${parsed.data.description} ($${(totalCents / 100).toFixed(2)}). Approve or decline: ${link}`
      ).catch((e) => console.error("[twilio] change-order sms failed:", e));
    }

    return json({ changeOrder: co, customerLink: `${PUBLIC_BASE}/portal/approve?token=${co.approvalToken}` });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
