import { prisma } from "./db";

// Generate a friendly referral code: 6 alphanumeric chars (no ambiguous I/O/0/1).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function makeReferralCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

// Ensure the user has a referral code. Idempotent — returns the existing one
// if already set. Used after signup or on first portal visit.
export async function ensureReferralCode(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (u?.referralCode) return u.referralCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeReferralCode();
    try {
      await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
      return code;
    } catch {
      // Unique collision — retry with a fresh code.
      continue;
    }
  }
  throw new Error("Could not allocate referral code");
}

// Credit loyalty points and write a ledger row in one transaction.
export async function awardLoyalty(args: {
  userId: string;
  delta: number;
  reason: string;
  invoiceId?: string;
}): Promise<void> {
  await prisma.$transaction([
    prisma.loyaltyLedger.create({
      data: {
        userId: args.userId,
        delta: args.delta,
        reason: args.reason,
        invoiceId: args.invoiceId,
      },
    }),
    // Note: loyaltyPoints lives on User; we increment in raw to avoid races.
    prisma.$executeRaw`UPDATE "User" SET "loyaltyPoints" = COALESCE("loyaltyPoints", 0) + ${args.delta} WHERE id = ${args.userId}`,
  ]);
}
