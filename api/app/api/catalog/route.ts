import { withCors, json } from "@/lib/cors";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Public catalog — used by customer self-booking and the QuoteForm to render
// an up-to-date list of packages with size-tier pricing. No auth required.
export const GET = withCors(async () => {
  const categories = await prisma.serviceCategory.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      packages: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        include: { pricing: true },
      },
    },
  });
  return json({ categories });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
