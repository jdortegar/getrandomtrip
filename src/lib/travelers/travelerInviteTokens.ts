import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import type { TravelerKind } from "@prisma/client";
import { isRosterLocked } from "./travelerRoster";

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

/**
 * Rotates the invite token IN PLACE on the owner `TripTraveler` row (no
 * delete-then-create — 1:1 cardinality). Overwrites `inviteTokenHash` +
 * `inviteTokenExpiresAt`, refreshes `invitedAt`, clears any prior
 * `reminderSentAt`, and flips `status` to `INVITED`. Returns the PLAINTEXT
 * token (only ever exposed here, for the email link) — only the SHA-256
 * hash is persisted.
 */
export async function issueTravelerInvite(travelerId: string): Promise<string> {
  const plaintext = randomBytes(32).toString("hex"); // 64 hex chars, 256-bit
  const tokenHash = hashToken(plaintext);
  const now = new Date();

  await prisma.tripTraveler.update({
    where: { id: travelerId },
    data: {
      inviteTokenHash: tokenHash,
      inviteTokenExpiresAt: new Date(now.getTime() + TTL_MS),
      invitedAt: now,
      reminderSentAt: null,
      status: "INVITED",
    },
  });

  return plaintext;
}

export type TravelerPeek =
  | {
      ok: true;
      travelerId: string;
      tripRequestId: string;
      kind: TravelerKind;
      buyerFirstName: string;
    }
  | { ok: false; reason: "invalid" | "expired" | "used" | "locked" };

type TravelerInviteRow = {
  id: string;
  tripRequestId: string;
  kind: TravelerKind;
  inviteTokenHash: string | null;
  inviteTokenExpiresAt: Date | null;
  tripRequest: {
    startDate: Date | null;
    travelersLockedAt: Date | null;
    user: { name: string };
  };
};

/**
 * Shared lookup + branch logic for `peekTravelerInvite` and
 * `consumeTravelerInvite` — the single place a plaintext token is resolved
 * to a row, checked for validity (unknown / already-consumed / expired /
 * past-cutoff), never duplicated between the two callers.
 */
async function resolveTravelerInvite(plaintext: string): Promise<TravelerPeek> {
  const tokenHash = hashToken(plaintext);
  const row = (await prisma.tripTraveler.findUnique({
    where: { inviteTokenHash: tokenHash },
    include: { tripRequest: { include: { user: true } } },
  })) as TravelerInviteRow | null;

  if (!row) return { ok: false, reason: "invalid" };
  if (!row.inviteTokenHash) return { ok: false, reason: "used" };
  if (row.inviteTokenExpiresAt && row.inviteTokenExpiresAt.getTime() < Date.now())
    return { ok: false, reason: "expired" };
  if (isRosterLocked(row.tripRequest)) return { ok: false, reason: "locked" };

  return {
    ok: true,
    travelerId: row.id,
    tripRequestId: row.tripRequestId,
    kind: row.kind,
    buyerFirstName: row.tripRequest.user.name.split(" ")[0],
  };
}

/**
 * Validate a token WITHOUT consuming it — used for the `/invite/[token]`
 * landing page render. Never mutates the row.
 */
export async function peekTravelerInvite(plaintext: string): Promise<TravelerPeek> {
  return resolveTravelerInvite(plaintext);
}

/**
 * Re-validate (expiry + cutoff, independently of any earlier peek), then
 * write the companion-submitted identity fields, stamp `submittedAt` +
 * `consentAt`, flip `status` to `COMPLETE`, and null the hash (single-use).
 */
export async function consumeTravelerInvite(
  plaintext: string,
  data: { fullName: string; idDocument: string; email?: string },
): Promise<TravelerPeek> {
  const resolved = await resolveTravelerInvite(plaintext);
  if (!resolved.ok) return resolved;

  const now = new Date();
  await prisma.tripTraveler.update({
    where: { id: resolved.travelerId },
    data: {
      fullName: data.fullName,
      idDocument: data.idDocument,
      ...(data.email !== undefined && { email: data.email }),
      submittedAt: now,
      consentAt: now,
      status: "COMPLETE",
      inviteTokenHash: null,
    },
  });

  return resolved;
}
