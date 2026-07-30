import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import type { TravelerKind, TravelerStatus } from "@prisma/client";
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
  status: TravelerStatus;
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
 *
 * IMPORTANT: `inviteTokenHash` is NEVER nulled on consume (see
 * `consumeTravelerInvite`) — it stays persisted so the row remains
 * findable by its original hash. Otherwise a real Postgres unique-column
 * lookup for that hash could never match the row again once nulled, and an
 * already-submitted link would incorrectly resolve to "invalid" instead of
 * "used". "Used" is discriminated by `status === "COMPLETE"`, checked
 * BEFORE expiry/cutoff so a used-but-now-also-expired/locked token still
 * reads as "used".
 */
async function resolveTravelerInvite(plaintext: string): Promise<TravelerPeek> {
  const tokenHash = hashToken(plaintext);
  const row = (await prisma.tripTraveler.findUnique({
    where: { inviteTokenHash: tokenHash },
    include: { tripRequest: { include: { user: true } } },
  })) as TravelerInviteRow | null;

  if (!row) return { ok: false, reason: "invalid" };
  if (row.status === "COMPLETE") return { ok: false, reason: "used" };
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
 * `consentAt`, and flip `status` to `COMPLETE`. Deliberately does NOT null
 * `inviteTokenHash` — the row must stay findable by that hash so a re-visit
 * of the same link resolves to "used" (via `resolveTravelerInvite`'s
 * `status === "COMPLETE"` check) rather than "invalid". Single-use is
 * enforced by `resolveTravelerInvite` refusing (early return, no write) any
 * row that is already `COMPLETE` — including on this exact call, so a
 * second `consumeTravelerInvite` with the same plaintext never re-writes.
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
    },
  });

  return resolved;
}
