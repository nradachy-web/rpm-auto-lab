import { withCors } from "@/lib/cors";
import { exchangeCode, saveConnection, decodeIdToken } from "@/lib/google";

export const runtime = "nodejs";

const PUBLIC_SITE = process.env.PUBLIC_ORIGIN ?? "https://nradachy-web.github.io";
const PUBLIC_BASE = PUBLIC_SITE.endsWith("/") ? `${PUBLIC_SITE}rpm-auto-lab` : `${PUBLIC_SITE}/rpm-auto-lab`;

export const GET = withCors(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (error) {
    return Response.redirect(`${PUBLIC_BASE}/portal/admin/integrations?error=${encodeURIComponent(error)}`, 302);
  }
  if (!code) {
    return Response.redirect(`${PUBLIC_BASE}/portal/admin/integrations?error=no-code`, 302);
  }
  try {
    const tokens = await exchangeCode(code);
    if (!tokens.refresh_token) {
      // Without a refresh token we can't keep the connection alive.
      return Response.redirect(`${PUBLIC_BASE}/portal/admin/integrations?error=no-refresh-token`, 302);
    }
    const id = tokens.id_token ? decodeIdToken(tokens.id_token) : {};
    if (!id.sub || !id.email) {
      return Response.redirect(`${PUBLIC_BASE}/portal/admin/integrations?error=no-id-token`, 302);
    }
    await saveConnection({
      email: id.email,
      sub: id.sub,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      accessTokenExpiry: new Date(Date.now() + (tokens.expires_in - 60) * 1000),
      scope: tokens.scope,
    });
    return Response.redirect(`${PUBLIC_BASE}/portal/admin/integrations?ok=1`, 302);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "exchange-failed";
    return Response.redirect(`${PUBLIC_BASE}/portal/admin/integrations?error=${encodeURIComponent(msg.slice(0, 60))}`, 302);
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
