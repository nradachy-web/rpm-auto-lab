import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { seedCatalog } from "@/lib/catalog-seed";

export const runtime = "nodejs";

export const POST = withCors(async () => {
  try {
    await requireAdmin();
    const result = await seedCatalog();
    return json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
