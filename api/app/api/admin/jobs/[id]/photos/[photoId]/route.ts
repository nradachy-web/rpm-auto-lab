import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deletePhoto } from "@/lib/blob";

export const runtime = "nodejs";

export const DELETE = withCors(async (req) => {
  try {
    await requireAdmin();
    const segments = new URL(req.url).pathname.split("/");
    const photoId = segments[segments.length - 1];
    if (!photoId) return json({ error: "Missing photo id" }, { status: 400 });

    const photo = await prisma.jobPhoto.findUnique({ where: { id: photoId } });
    if (!photo) return json({ error: "Photo not found" }, { status: 404 });

    await deletePhoto(photo.url).catch((e) => console.error("[blob/del] failed:", e));
    await prisma.jobPhoto.delete({ where: { id: photoId } });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
