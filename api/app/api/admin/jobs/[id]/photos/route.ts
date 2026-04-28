import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadPhoto } from "@/lib/blob";

export const runtime = "nodejs";

const ALLOWED_STAGES = new Set(["before", "in_progress", "after"]);

export const POST = withCors(async (req) => {
  try {
    const admin = await requireAdmin();
    const url = new URL(req.url);
    const id = url.pathname.split("/").slice(-2, -1)[0]; // /admin/jobs/:id/photos
    if (!id) return json({ error: "Missing job id" }, { status: 400 });

    const job = await prisma.job.findUnique({ where: { id }, select: { id: true } });
    if (!job) return json({ error: "Job not found" }, { status: 404 });

    const form = await req.formData();
    const file = form.get("file");
    const stageRaw = form.get("stage");
    const captionRaw = form.get("caption");

    if (!(file instanceof Blob)) {
      return json({ error: "No file uploaded" }, { status: 400 });
    }
    const stage = typeof stageRaw === "string" && ALLOWED_STAGES.has(stageRaw) ? stageRaw : "in_progress";
    const caption = typeof captionRaw === "string" && captionRaw.trim() ? captionRaw.trim().slice(0, 280) : null;
    const fileName = (file as File).name || "photo.jpg";

    const { url: blobUrl, pathname } = await uploadPhoto({
      jobId: job.id,
      fileName,
      contentType: file.type || "image/jpeg",
      body: file,
      byteLength: file.size,
    });

    const created = await prisma.jobPhoto.create({
      data: {
        jobId: job.id,
        url: blobUrl,
        pathname,
        caption,
        stage: stage as "before" | "in_progress" | "after",
        uploadedBy: admin.id,
      },
    });
    return json({ photo: created });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    const msg = e instanceof Error ? e.message : "Upload failed";
    return json({ error: msg }, { status: 400 });
  }
});

export const GET = withCors(async (req) => {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const id = url.pathname.split("/").slice(-2, -1)[0];
    if (!id) return json({ error: "Missing job id" }, { status: 400 });
    const photos = await prisma.jobPhoto.findMany({
      where: { jobId: id },
      orderBy: { uploadedAt: "asc" },
    });
    return json({ photos });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
