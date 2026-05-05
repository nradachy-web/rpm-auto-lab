import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Returns quotes grouped by status for a Kanban view.
export const GET = withCors(async () => {
  try {
    await requireAdmin();
    const quotes = await prisma.quote.findMany({
      orderBy: { submittedAt: "desc" },
      take: 200,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        vehicle: { select: { id: true, year: true, make: true, model: true, trim: true } },
        options: { orderBy: { sortOrder: "asc" } },
        jobs: { select: { id: true, status: true } },
      },
    });
    return json({ quotes });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
