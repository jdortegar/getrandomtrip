import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import type { AccessInviteKind, UserRole } from "@prisma/client";
import { addMembershipRole, buildUserRoleUpdate } from "./prismaUserRoles";

export type { AccessInviteKind };

/**
 * Legacy wire name, kept deliberately — see design ADR 5. Kind-agnostic: the
 * same cookie carries both TRIPPER and SITE_ACCESS pending-invite tokens.
 * Renaming it would drop in-flight OAuth invites during a deploy window.
 */
export const ACCESS_INVITE_COOKIE = "grt_tripper_invite";

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

/**
 * Invalidates prior unconsumed invites for the email (ANY kind — one live
 * invite per email, newest admin intent wins), then issues a new one.
 * Returns the PLAINTEXT token (only ever exposed here, for the email link) —
 * only the SHA-256 hash is persisted.
 */
export async function issueAccessInvite(
  email: string,
  kind: AccessInviteKind,
): Promise<string> {
  const plaintext = randomBytes(32).toString("hex"); // 64 hex chars, 256-bit
  const tokenHash = hashToken(plaintext);
  const expiresAt = new Date(Date.now() + TTL_MS);

  await prisma.$transaction([
    prisma.accessInvite.deleteMany({
      where: { email, consumedAt: null },
    }),
    prisma.accessInvite.create({
      data: { email, tokenHash, expiresAt, kind },
    }),
  ]);

  return plaintext;
}

export type InvitePeek =
  | { ok: true; email: string; kind: AccessInviteKind }
  | { ok: false; reason: "invalid" | "expired" | "used" };

async function resolveInvite(plaintext: string): Promise<InvitePeek> {
  const tokenHash = hashToken(plaintext);
  const row = await prisma.accessInvite.findUnique({ where: { tokenHash } });

  if (!row) return { ok: false, reason: "invalid" };
  if (row.consumedAt) return { ok: false, reason: "used" };
  if (row.expiresAt.getTime() < Date.now())
    return { ok: false, reason: "expired" };

  return { ok: true, email: row.email, kind: row.kind };
}

/**
 * Validate a token WITHOUT consuming it — used for page render decisions and
 * the create-time role decision (register / OAuth), which must not burn the
 * token before the account is actually created.
 */
export async function peekAccessInvite(plaintext: string): Promise<InvitePeek> {
  return resolveInvite(plaintext);
}

/**
 * Validate + mark the token consumed (single-use). Same result shape as
 * `peekAccessInvite`.
 */
export async function consumeAccessInvite(
  plaintext: string,
): Promise<InvitePeek> {
  const tokenHash = hashToken(plaintext);
  const row = await prisma.accessInvite.findUnique({ where: { tokenHash } });

  if (!row) return { ok: false, reason: "invalid" };
  if (row.consumedAt) return { ok: false, reason: "used" };
  if (row.expiresAt.getTime() < Date.now())
    return { ok: false, reason: "expired" };

  await prisma.accessInvite.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });

  return { ok: true, email: row.email, kind: row.kind };
}

/**
 * Admin badge derivation, batched. Kind-agnostic — answers "is there a live
 * invite for this email", true of either kind. Only unconsumed rows are
 * considered — a consumed invite renders as an accepted state, not
 * "invited"/"expired".
 */
export async function getAccessInviteStatuses(
  emails: string[],
): Promise<Map<string, "invited" | "expired">> {
  const rows = await prisma.accessInvite.findMany({
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
 * grant access only when there was a pending invite cookie AND its peek
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
 * First-grant-wins stamp of the gate signal. Shared by `grantAccessAndCleanup`
 * and `/api/travelers/submit`. Uses `updateMany`, NOT `update` — `update`
 * only accepts unique fields in `where`, so the `siteAccessGrantedAt: null`
 * guard is illegal there. A no-op (count: 0) on an already-granted user.
 */
export async function stampSiteAccess(userId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { id: userId, siteAccessGrantedAt: null },
    data: { siteAccessGrantedAt: new Date() },
  });
}

/**
 * SITE_ACCESS → stamp only. TRIPPER → stamp + append the TRIPPER role
 * (+ tripperSince on first grant). Both kinds then clear the waitlist row.
 */
export async function grantAccessAndCleanup(
  userId: string,
  email: string,
  kind: AccessInviteKind,
): Promise<void> {
  if (kind === "TRIPPER") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });

    const currentRoles: UserRole[] = user?.roles ?? ["TRAVELER"];
    const isNewTripper = !currentRoles.includes("TRIPPER");
    const { roles } = buildUserRoleUpdate(
      addMembershipRole(currentRoles, "TRIPPER"),
    );

    await prisma.user.update({
      where: { id: userId },
      data: {
        roles: { set: roles },
        ...(isNewTripper ? { tripperSince: new Date() } : {}),
      },
    });
  }

  await stampSiteAccess(userId);

  await prisma.waitlistEntry.deleteMany({ where: { email } });
}
