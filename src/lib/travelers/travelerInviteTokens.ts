import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import type { TravelerKind, TravelerStatus } from "@prisma/client";
import { isRosterLocked } from "./travelerRoster";
import {
  hasMissingTravelerDetails,
  isTravelerFieldFilled,
  isTripEnded,
} from "./travelerPolicy";
import { emailsMatch, maskEmail } from "./travelerEmail";

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
export async function issueTravelerInvite(
  travelerId: string,
  expectedStatus?: TravelerStatus,
): Promise<string> {
  const plaintext = randomBytes(32).toString("hex"); // 64 hex chars, 256-bit
  const tokenHash = hashToken(plaintext);
  const now = new Date();

  await prisma.tripTraveler.update({
    where: {
      id: travelerId,
      ...(expectedStatus && { status: expectedStatus }),
    },
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
      idDocumentRequired: boolean;
      /**
       * Full invited address. Non-null ONLY when the viewer passed to
       * `peekTravelerInvite` is signed in with that address — never for an
       * anonymous or mismatched viewer (the page payload is server-rendered).
       */
      invitedEmail: string | null;
      /** `j***@gmail.com` form, safe to show to any viewer. */
      maskedEmail: string | null;
      /**
       * Whether the viewer's session email equals the invited address; `null`
       * when no viewer email was supplied (anonymous).
       */
      viewerEmailMatches: boolean | null;
    }
  | { ok: false; reason: "invalid" | "expired" | "used" | "ended" };

/**
 * `consume` additionally refuses a session whose email differs from the invite
 * and an account whose own email is not verified.
 */
export type TravelerConsumeResult =
  | TravelerPeek
  | { ok: false; reason: "email_mismatch" | "email_unverified" };

type TravelerInviteRow = {
  id: string;
  tripRequestId: string;
  kind: TravelerKind;
  status: TravelerStatus;
  fullName: string | null;
  email: string | null;
  idDocument: string | null;
  dateOfBirth: Date | null;
  userId: string | null;
  inviteTokenHash: string | null;
  inviteTokenExpiresAt: Date | null;
  tripRequest: {
    type?: string;
    startDate: Date | null;
    endDate?: Date | null;
    departureTimeZone?: string | null;
    travelersLockedAt: Date | null;
    user: { name: string };
  };
};

/**
 * Shared lookup + branch logic for `peekTravelerInvite` and
 * `consumeTravelerInvite` — the single place a plaintext token is resolved
 * to a row, checked for validity (unknown / already-consumed / expired /
 * trip already ended), never duplicated between the two callers.
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
async function resolveTravelerInvite(
  plaintext: string,
): Promise<TravelerPeek & { row?: TravelerInviteRow }> {
  const tokenHash = hashToken(plaintext);
  const row = (await prisma.tripTraveler.findUnique({
    where: { inviteTokenHash: tokenHash },
    include: { tripRequest: { include: { user: true } } },
  })) as TravelerInviteRow | null;

  if (!row) return { ok: false, reason: "invalid" };
  if (row.status === "COMPLETE") return { ok: false, reason: "used" };
  // The details cutoff never blocks acceptance: past it, `consume` only links
  // the account and fills gaps. The invite dies when the trip ends.
  if (isTripEnded(row.tripRequest)) return { ok: false, reason: "ended" };
  if (
    row.inviteTokenExpiresAt &&
    row.inviteTokenExpiresAt.getTime() < Date.now()
  )
    return { ok: false, reason: "expired" };

  return {
    ok: true,
    travelerId: row.id,
    tripRequestId: row.tripRequestId,
    kind: row.kind,
    buyerFirstName: row.tripRequest.user.name.split(" ")[0],
    idDocumentRequired:
      !isRosterLocked(row.tripRequest) ||
      !isTravelerFieldFilled(row.idDocument),
    invitedEmail: null,
    maskedEmail: maskEmail(row.email),
    viewerEmailMatches: null,
    row,
  };
}

function publicPeek(
  resolved: Extract<TravelerPeek, { ok: true }>,
): TravelerPeek {
  return {
    ok: true,
    travelerId: resolved.travelerId,
    tripRequestId: resolved.tripRequestId,
    kind: resolved.kind,
    buyerFirstName: resolved.buyerFirstName,
    idDocumentRequired: resolved.idDocumentRequired,
    invitedEmail: null,
    maskedEmail: resolved.maskedEmail,
    viewerEmailMatches: null,
  };
}

/**
 * Validate a token WITHOUT consuming it — used for the `/invite/[token]`
 * landing page render. Never mutates the row. Pass the viewer's session email
 * (when signed in) to learn whether it matches the invite; the full invited
 * address is returned only on a match, so the server-rendered page never
 * carries it for anyone else.
 */
export async function peekTravelerInvite(
  plaintext: string,
  viewerEmail?: string | null,
): Promise<TravelerPeek> {
  const resolved = await resolveTravelerInvite(plaintext);
  if (!resolved.ok) return resolved;
  const peek = publicPeek(resolved);
  if (!peek.ok || !viewerEmail?.trim()) return peek;
  const matches = emailsMatch(resolved.row?.email, viewerEmail);
  return {
    ...peek,
    invitedEmail: matches ? (resolved.row?.email?.trim() ?? null) : null,
    viewerEmailMatches: matches,
  };
}

/**
 * Re-validate (expiry + cutoff, independently of any earlier peek), then
 * write the companion-submitted identity fields, stamp `submittedAt` +
 * `consentAt`, and flip `status` to `COMPLETE`. Deliberately does NOT null
 * `inviteTokenHash` — the row must stay findable by that hash so a re-visit
 * of the same link resolves to "used" (via `resolveTravelerInvite`'s
 * `status === "COMPLETE"` check) rather than "invalid". Single-use is
 * enforced by the COMPLETE check and an atomic status/token/identity
 * compare-and-swap, so concurrent submissions cannot rewrite the row.
 */
export async function consumeTravelerInvite(
  plaintext: string,
  data: {
    fullName: string;
    idDocument?: string;
    email?: string;
    userId?: string;
    /**
     * `User.emailVerified` of the claiming account, read from the DB by the
     * caller (never from the client or a JWT). Required for a claim to link an
     * account: a null/missing value is rejected as `email_unverified`.
     */
    emailVerified?: Date | null;
  },
): Promise<TravelerConsumeResult> {
  const resolved = await resolveTravelerInvite(plaintext);
  if (!resolved.ok) return resolved;

  const row = resolved.row!;
  // The link alone is not enough: the claiming account must own the address
  // the invite was sent to, so a forwarded link cannot be claimed.
  if (!emailsMatch(row.email, data.email)) {
    return { ok: false, reason: "email_mismatch" };
  }
  // A matching address is not proof of ownership until the account verified
  // it (credentials sign-ups are unverified; Google accounts are verified).
  if (data.userId !== undefined && !data.emailVerified) {
    return { ok: false, reason: "email_unverified" };
  }
  const locked = isRosterLocked(row.tripRequest);
  if (locked && row.userId && row.userId !== data.userId) {
    return { ok: false, reason: "invalid" };
  }
  // Auth-derived name/email may differ from the buyer's saved values. After
  // cutoff retain populated identity, filling only the gaps from the claim.
  const fullName =
    locked && isTravelerFieldFilled(row.fullName)
      ? row.fullName
      : data.fullName.trim();
  const email =
    locked && isTravelerFieldFilled(row.email)
      ? row.email
      : (data.email?.trim() ?? row.email);
  const idDocument =
    locked && isTravelerFieldFilled(row.idDocument)
      ? row.idDocument
      : (data.idDocument?.trim() ?? row.idDocument);
  if (hasMissingTravelerDetails({ ...row, fullName, email, idDocument })) {
    return { ok: false, reason: "invalid" };
  }
  const now = new Date();
  try {
    await prisma.tripTraveler.update({
      where: {
        id: row.id,
        inviteTokenHash: hashToken(plaintext),
        status: row.status,
        userId: row.userId,
        fullName: row.fullName,
        email: row.email,
        idDocument: row.idDocument,
        inviteTokenExpiresAt: row.inviteTokenExpiresAt,
      },
      data: {
        fullName,
        idDocument,
        email,
        ...(data.userId !== undefined && { userId: data.userId }),
        submittedAt: now,
        consentAt: now,
        status: "COMPLETE",
      },
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return { ok: false, reason: "invalid" };
    }
    throw error;
  }
  return publicPeek(resolved);
}

/**
 * Short-lived httpOnly cookie carrying a live traveler-invite grant into
 * `authorize()` — minted only by `POST /api/travelers/invite-auth-init`
 * after a server-side `peekTravelerInvite` succeeds. Mirrors the shipped
 * `grt_tripper_invite` idiom.
 */
export const TRAVELER_INVITE_COOKIE = "grt_traveler_invite";

/**
 * True only for a live, unconsumed invite — no email match (see design
 * decision #9: the token alone is the whole grant). Takes the raw cookie
 * value rather than reading `cookies()` itself, so this unit-tests without
 * mocking `next/headers`.
 */
export async function hasLiveTravelerInviteGrant(
  cookieValue: string | undefined,
): Promise<boolean> {
  if (!cookieValue) return false;
  return (await peekTravelerInvite(cookieValue)).ok;
}
