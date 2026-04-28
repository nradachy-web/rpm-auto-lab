import { withCors, json } from "@/lib/cors";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export const GET = withCors(async () => {
  const user = await currentUser();
  if (!user) return json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    include: {
      vehicle: true,
      events: { orderBy: { at: "desc" } },
      quote: true,
      photos: { orderBy: { uploadedAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return json({ jobs });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
