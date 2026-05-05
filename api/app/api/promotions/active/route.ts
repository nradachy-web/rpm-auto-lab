import { withCors, json } from "@/lib/cors";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Public — currently-active promotions used by the marketing site and the
// public quote-accept page. Filter by surface via ?surface=accept|site.
export const GET = withCors(async (req) => {
  const url = new URL(req.url);
  const surface = url.searchParams.get("surface");
  const now = new Date();
  const where: Record<string, unknown> = {
    active: true,
    startsAt: { lte: now },
    OR: [{ endsAt: null }, { endsAt: { gt: now } }],
  };
  if (surface === "accept") where.showOnAccept = true;
  else if (surface === "site") where.showOnSite = true;
  const promotions = await prisma.promotion.findMany({
    where,
    orderBy: { startsAt: "desc" },
    take: 6,
  });
  return json({ promotions });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
