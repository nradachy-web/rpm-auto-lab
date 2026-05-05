import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError, generateToken } from "@/lib/auth";
import { authorizeUrl } from "@/lib/google";

export const runtime = "nodejs";

// Admin clicks "Connect Google" → we redirect them to Google's consent
// screen. We pass a CSRF state token in the URL; the callback verifies
// it. (For now we just generate a fresh token each click — anything
// stronger would need a session-bound store.)
export const GET = withCors(async () => {
  try {
    await requireAdmin();
    const state = generateToken();
    const url = authorizeUrl(state);
    return json({ url, state });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    const msg = e instanceof Error ? e.message : "Server error";
    return json({ error: msg }, { status: 500 });
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
