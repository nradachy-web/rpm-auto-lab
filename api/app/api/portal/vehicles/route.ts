import { withCors, json } from "@/lib/cors";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export const GET = withCors(async () => {
  const user = await currentUser();
  if (!user) return json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return json({ vehicles });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
