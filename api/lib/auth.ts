import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { headers } from "next/headers";
import { getSession, unsealSessionFromAuthHeader } from "./session";
import { prisma } from "./db";
import type { User } from "@prisma/client";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// 32 bytes of entropy, url-safe.
export function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export async function currentUser(): Promise<User | null> {
  // Try cookie-based session first (desktop happy path).
  const session = await getSession();
  let userId = session.userId;

  // Fall back to bearer token from the Authorization header. This is what
  // mobile browsers (especially iOS Safari) hit when third-party cookies
  // are blocked.
  if (!userId) {
    const hdrs = await headers();
    const auth = hdrs.get("authorization");
    const tokenSession = await unsealSessionFromAuthHeader(auth);
    userId = tokenSession.userId;
  }

  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function requireUser(): Promise<User> {
  const u = await currentUser();
  if (!u) throw new AuthError("UNAUTHENTICATED");
  return u;
}

export async function requireAdmin(): Promise<User> {
  const u = await requireUser();
  if (u.role !== "admin") throw new AuthError("FORBIDDEN");
  return u;
}

export class AuthError extends Error {
  constructor(public code: "UNAUTHENTICATED" | "FORBIDDEN") {
    super(code);
  }
}
