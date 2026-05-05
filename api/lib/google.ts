// Minimal Google OAuth + REST helper. We avoid the official SDK to keep
// the serverless cold-start small and the dependency surface tight.
//
// Pattern: store ONE shop-level GoogleConnection row keyed by scope="shop".
// Refresh tokens are long-lived; we cache short-lived access tokens and
// auto-refresh when expired.

import { prisma } from "./db";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

const SHOP_SCOPE = "shop";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/business.manage",
  "https://www.googleapis.com/auth/gmail.send",
];

const PUBLIC_SITE = process.env.PUBLIC_ORIGIN ?? "https://nradachy-web.github.io";
function apiOrigin(): string {
  // The OAuth callback must be served from the API host, not the static
  // GH Pages site, because Google validates the redirect_uri exactly.
  return process.env.API_PUBLIC_URL || "https://rpm-auto-lab-api.vercel.app";
}

export function authorizeUrl(state: string): string {
  const cid = requireEnv("GOOGLE_OAUTH_CLIENT_ID");
  const params = new URLSearchParams({
    client_id: cid,
    redirect_uri: `${apiOrigin()}/api/google/oauth/callback`,
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",                // force refresh-token issuance
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token?: string;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    code,
    client_id: requireEnv("GOOGLE_OAUTH_CLIENT_ID"),
    client_secret: requireEnv("GOOGLE_OAUTH_CLIENT_SECRET"),
    redirect_uri: `${apiOrigin()}/api/google/oauth/callback`,
    grant_type: "authorization_code",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<TokenResponse>;
}

export async function saveConnection(args: {
  email: string;
  sub: string;
  refreshToken: string;
  accessToken: string;
  accessTokenExpiry: Date;
  scope: string;
}): Promise<void> {
  await prisma.googleConnection.upsert({
    where: { scope: SHOP_SCOPE },
    create: {
      scope: SHOP_SCOPE,
      googleEmail: args.email,
      googleSub: args.sub,
      refreshToken: args.refreshToken,
      accessToken: args.accessToken,
      accessTokenExpiry: args.accessTokenExpiry,
      scopes: args.scope,
    },
    update: {
      googleEmail: args.email,
      googleSub: args.sub,
      refreshToken: args.refreshToken,
      accessToken: args.accessToken,
      accessTokenExpiry: args.accessTokenExpiry,
      scopes: args.scope,
    },
  });
}

export async function getConnection() {
  return prisma.googleConnection.findUnique({ where: { scope: SHOP_SCOPE } });
}

export async function getAccessToken(): Promise<string | null> {
  const conn = await getConnection();
  if (!conn) return null;
  const fresh = conn.accessToken && conn.accessTokenExpiry && conn.accessTokenExpiry.getTime() > Date.now() + 30 * 1000;
  if (fresh) return conn.accessToken!;
  // Refresh.
  const params = new URLSearchParams({
    client_id: requireEnv("GOOGLE_OAUTH_CLIENT_ID"),
    client_secret: requireEnv("GOOGLE_OAUTH_CLIENT_SECRET"),
    refresh_token: conn.refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!res.ok) {
    console.error("Google refresh failed:", res.status, await res.text().catch(() => ""));
    return null;
  }
  const body = await res.json() as TokenResponse;
  const expiry = new Date(Date.now() + (body.expires_in - 60) * 1000);
  await prisma.googleConnection.update({
    where: { id: conn.id },
    data: { accessToken: body.access_token, accessTokenExpiry: expiry },
  });
  return body.access_token;
}

// Decode the id_token JWT *without* verifying the signature. We only use
// it for the user's email + sub to identify the connection — anything
// security-sensitive uses live API calls.
export function decodeIdToken(idToken: string): { email?: string; sub?: string } {
  try {
    const [, payloadB64] = idToken.split(".");
    if (!payloadB64) return {};
    const json = Buffer.from(payloadB64, "base64url").toString("utf-8");
    return JSON.parse(json) as { email?: string; sub?: string };
  } catch {
    return {};
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}
