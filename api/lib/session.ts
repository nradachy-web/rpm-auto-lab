import { cookies } from "next/headers";
import { getIronSession, sealData, unsealData, type SessionOptions } from "iron-session";

export interface Session {
  userId?: string;
  role?: "customer" | "admin";
}

const rawPassword = process.env.SESSION_PASSWORD;
if (!rawPassword || rawPassword.length < 32) {
  throw new Error("SESSION_PASSWORD env var must be set and at least 32 chars long");
}

const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export const sessionOptions: SessionOptions = {
  password: rawPassword,
  cookieName: "rpm_session",
  cookieOptions: {
    // Site is on github.io, API is on vercel.app — cross-site cookie is required.
    // We also pass `partitioned: true` so modern browsers (Chrome/Edge) accept
    // it under their third-party cookie restrictions. iOS Safari < 18 still
    // blocks cross-site cookies entirely; for that case we fall through to the
    // bearer-token path (see authTokenFromHeader).
    sameSite: "none",
    secure: true,
    httpOnly: true,
    path: "/",
    maxAge: TTL_SECONDS,
    // @ts-expect-error — partitioned is supported in Next 15+ but not yet in
    // iron-session's CookieOptions type.
    partitioned: true,
  },
};

// Cookie-based session (the desktop happy path).
export async function getSession(): Promise<Session> {
  const cookieStore = await cookies();
  return await getIronSession<Session>(cookieStore, sessionOptions);
}

// Seal a session payload into a self-contained string the client can store
// and send back as `Authorization: Bearer <token>`. Same crypto as the cookie
// flow — just delivered out-of-band so it works in browsers that block
// cross-site cookies.
export async function sealSessionToken(data: Session): Promise<string> {
  return sealData(data, { password: rawPassword!, ttl: TTL_SECONDS });
}

// Read and decrypt a bearer token from an Authorization header. Returns an
// empty session if no token, malformed, or expired.
export async function unsealSessionFromAuthHeader(authHeader: string | null | undefined): Promise<Session> {
  if (!authHeader) return {};
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) return {};
  try {
    return await unsealData<Session>(m[1].trim(), { password: rawPassword!, ttl: TTL_SECONDS });
  } catch {
    return {};
  }
}
