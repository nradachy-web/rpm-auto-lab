import { withCors, json } from "@/lib/cors";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";

export const runtime = "nodejs";

export const GET = withCors(async () => {
  const user = await currentUser();
  if (!user) return json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return json({ plans: SUBSCRIPTION_PLANS, subscriptions });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
