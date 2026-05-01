import { withCors, json } from "@/lib/cors";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Public reviews feed — published reviews with first-name only for privacy.
export const GET = withCors(async () => {
  const reviews = await prisma.review.findMany({
    where: { publishedAt: { not: null }, rating: { gte: 4 } },
    orderBy: { publishedAt: "desc" },
    take: 12,
    include: {
      user: { select: { name: true } },
      job: { include: { vehicle: { select: { year: true, make: true, model: true } } } },
    },
  });
  const out = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    publishedAt: r.publishedAt,
    firstName: (r.user.name || "").split(/\s+/)[0] || "Customer",
    vehicle: r.job?.vehicle ? `${r.job.vehicle.year} ${r.job.vehicle.make} ${r.job.vehicle.model}` : null,
  }));
  return json({ reviews: out });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
