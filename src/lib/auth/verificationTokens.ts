import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import type { VerificationTokenType } from "@prisma/client";

const TTL_MS = {
  EMAIL_VERIFY: 24 * 60 * 60 * 1000, // 24h
  PASSWORD_RESET: 60 * 60 * 1000, // 1h
} as const;

function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

/**
 * Invalidates prior unconsumed same-type tokens, then issues a new one.
 * Returns the PLAINTEXT token (only ever exposed here, for the email link) —
 * only the SHA-256 hash is persisted.
 */
export async function issueVerificationToken(
  userId: string,
  type: VerificationTokenType,
): Promise<string> {
  const plaintext = randomBytes(32).toString("hex"); // 64 hex chars, 256-bit
  const tokenHash = hashToken(plaintext);
  const expiresAt = new Date(Date.now() + TTL_MS[type]);

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({
      where: { userId, type, consumedAt: null },
    }),
    prisma.verificationToken.create({
      data: { userId, type, tokenHash, expiresAt },
    }),
  ]);

  return plaintext;
}

export type ConsumeResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid" | "expired" | "used" };

/**
 * Hashes the incoming plaintext, validates type + expiry + unused, and marks
 * the token consumed (single-use).
 */
export async function consumeVerificationToken(
  plaintext: string,
  type: VerificationTokenType,
): Promise<ConsumeResult> {
  const tokenHash = hashToken(plaintext);
  const row = await prisma.verificationToken.findUnique({
    where: { tokenHash },
  });

  if (!row || row.type !== type) return { ok: false, reason: "invalid" };
  if (row.consumedAt) return { ok: false, reason: "used" };
  if (row.expiresAt.getTime() < Date.now())
    return { ok: false, reason: "expired" };

  await prisma.verificationToken.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });

  return { ok: true, userId: row.userId };
}
