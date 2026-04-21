import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export interface Session {
  userId?: string;
  role?: "customer" | "admin";
}

const rawPassword = process.env.SESSION_PASSWORD;
if (!rawPassword || rawPassword.length < 32) {
  // Fail fast at boot rather than silently running with weak/empty entropy.
  // Vercel build should surface this as a missing env var.
  throw new Error(
    "SESSION_PASSWORD env var must be set and at least 32 chars long"
  );
}

export const sessionOptions: SessionOptions = {
  password: rawPassword,
  cookieName: "rpm_session",
  cookieOptions: {
    // Site is on github.io, API is on vercel.app — cross-site cookie is required.
    sameSite: "none",
    secure: true,
    httpOnly: true,
    path: "/",
    // 30 days
    maxAge: 60 * 60 * 24 * 30,
  },
};

export async function getSession(): Promise<Session> {
  const cookieStore = await cookies();
  return await getIronSession<Session>(cookieStore, sessionOptions);
}
