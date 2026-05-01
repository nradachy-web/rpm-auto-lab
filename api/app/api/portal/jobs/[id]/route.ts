import { withCors, json } from "@/lib/cors";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export const GET = withCors(async (req) => {
  const user = await currentUser();
  if (!user) return json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const id = new URL(req.url).pathname.split("/").pop();
  if (!id) return json({ error: "Missing id" }, { status: 400 });
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      vehicle: true,
      events: { orderBy: { at: "desc" } },
      photos: { orderBy: { uploadedAt: "asc" } },
      bay: true,
      technician: true,
      invoice: { select: { id: true, number: true, status: true, balanceCents: true, totalCents: true } },
    },
  });
  if (!job) return json({ error: "Not found" }, { status: 404 });
  if (user.role !== "admin" && job.userId !== user.id) return json({ error: "Forbidden" }, { status: 403 });
  return json({ job });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
