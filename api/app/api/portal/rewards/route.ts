import { withCors, json } from "@/lib/cors";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureReferralCode } from "@/lib/loyalty";

export const runtime = "nodejs";

export const GET = withCors(async () => {
  const user = await currentUser();
  if (!user) return json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const code = user.referralCode ?? await ensureReferralCode(user.id);
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { loyaltyPoints: true },
  });
  const ledger = await prisma.loyaltyLedger.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const referralCount = await prisma.user.count({ where: { referredById: user.id } });
  return json({
    points: fresh?.loyaltyPoints ?? 0,
    referralCode: code,
    ledger,
    referralCount,
  });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
