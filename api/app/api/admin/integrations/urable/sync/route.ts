import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { runUrableSync } from "@/lib/urable";

export const runtime = "nodejs";
// Sync can take 20+ seconds on a big account. Bump the function ceiling.
export const maxDuration = 60;

export const POST = withCors(async () => {
  try {
    await requireAdmin();
    if (!process.env.URABLE_API_TOKEN) {
      return json({ error: "Urable not configured. Set URABLE_API_TOKEN in Vercel." }, { status: 503 });
    }
    const result = await runUrableSync();
    return json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    const msg = e instanceof Error ? e.message : "Sync failed";
    return json({ error: msg }, { status: 500 });
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
