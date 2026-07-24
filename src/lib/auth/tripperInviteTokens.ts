import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import { addMembershipRole, buildUserRoleUpdate } from "./prismaUserRoles";

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

/**
 * Invalidates prior unconsumed invites for the email, then issues a new one.
 * Returns the PLAINTEXT token (only ever exposed here, for the email link) —
 * only the SHA-256 hash is persisted.
 */
export async function issueTripperInvite(email: string): Promise<string> {
  const plaintext = randomBytes(32).toString("hex"); // 64 hex chars, 256-bit
  const tokenHash = hashToken(plaintext);
  const expiresAt = new Date(Date.now() + TTL_MS);

  await prisma.$transaction([
    prisma.tripperInvite.deleteMany({
      where: { email, consumedAt: null },
    }),
    prisma.tripperInvite.create({
      data: { email, tokenHash, expiresAt },
    }),
  ]);

  return plaintext;
}

export type InvitePeek =
  | { ok: true; email: string }
  | { ok: false; reason: "invalid" | "expired" | "used" };

async function resolveInvite(plaintext: string): Promise<InvitePeek> {
  const tokenHash = hashToken(plaintext);
  const row = await prisma.tripperInvite.findUnique({ where: { tokenHash } });

  if (!row) return { ok: false, reason: "invalid" };
  if (row.consumedAt) return { ok: false, reason: "used" };
  if (row.expiresAt.getTime() < Date.now())
    return { ok: false, reason: "expired" };

  return { ok: true, email: row.email };
}

/**
 * Validate a token WITHOUT consuming it — used for page render decisions and
 * the create-time role decision (register / OAuth), which must not burn the
 * token before the account is actually created.
 */
export async function peekTripperInvite(plaintext: string): Promise<InvitePeek> {
  return resolveInvite(plaintext);
}

/**
 * Validate + mark the token consumed (single-use). Same result shape as
 * `peekTripperInvite`.
 */
export async function consumeTripperInvite(
  plaintext: string,
): Promise<InvitePeek> {
  const tokenHash = hashToken(plaintext);
  const row = await prisma.tripperInvite.findUnique({ where: { tokenHash } });

  if (!row) return { ok: false, reason: "invalid" };
  if (row.consumedAt) return { ok: false, reason: "used" };
  if (row.expiresAt.getTime() < Date.now())
    return { ok: false, reason: "expired" };

  await prisma.tripperInvite.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });

  return { ok: true, email: row.email };
}

/**
 * Admin badge derivation, batched. Only unconsumed rows are considered — a
 * consumed invite renders as an accepted state, not "invited"/"expired".
 */
export async function getTripperInviteStatuses(
  emails: string[],
): Promise<Map<string, "invited" | "expired">> {
  const rows = await prisma.tripperInvite.findMany({
    where: { email: { in: emails }, consumedAt: null },
    select: { email: true, expiresAt: true },
  });

  const statuses = new Map<string, "invited" | "expired">();
  const now = Date.now();
  for (const row of rows) {
    statuses.set(
      row.email,
      row.expiresAt.getTime() < now ? "expired" : "invited",
    );
  }
  return statuses;
}

/**
 * Pure decision helper for the Google-create branch in `signIn` (auth.ts):
 * grant TRIPPER only when there was a pending invite cookie AND its peek
 * result's email matches the just-created OAuth account's email exactly.
 * Extracted so the branch is testable without NextAuth/cookie mocking.
 */
export function resolveOAuthInviteGrant(
  peek: InvitePeek | null,
  createdEmail: string,
): boolean {
  return !!peek?.ok && peek.email === createdEmail;
}

/**
 * Append TRIPPER to the user's roles (preserving existing membership), then
 * delete any waitlist row for the same email if one exists.
 */
export async function grantTripperAndCleanup(
  userId: string,
  email: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });

  const currentRoles: UserRole[] = user?.roles ?? ["CLIENT"];
  const { roles } = buildUserRoleUpdate(
    addMembershipRole(currentRoles, "TRIPPER"),
  );

  await prisma.user.update({
    where: { id: userId },
    data: { roles: { set: roles } },
  });

  await prisma.waitlistEntry.deleteMany({ where: { email } });
}
