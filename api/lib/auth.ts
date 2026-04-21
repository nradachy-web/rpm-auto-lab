import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { getSession } from "./session";
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
  const session = await getSession();
  if (!session.userId) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
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
