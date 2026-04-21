import { withCors, json } from "@/lib/cors";
import { currentUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export const GET = withCors(async () => {
  try {
    const user = await currentUser();
    if (!user) return json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const [vehicles, quotes, jobs] = await Promise.all([
      prisma.vehicle.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
      prisma.quote.findMany({
        where: { userId: user.id },
        include: { vehicle: true },
        orderBy: { submittedAt: "desc" },
        take: 10,
      }),
      prisma.job.findMany({
        where: { userId: user.id },
        include: { vehicle: true, events: { orderBy: { at: "desc" }, take: 1 } },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
    ]);

    return json({ vehicles, quotes, jobs });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
