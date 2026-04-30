import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export const GET = withCors(async () => {
  try {
    await requireAdmin();
    const categories = await prisma.serviceCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        packages: {
          orderBy: { sortOrder: "asc" },
          include: { pricing: true },
        },
      },
    });
    return json({ categories });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
