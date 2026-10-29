import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import type { TravelerKind, TravelerStatus } from "@prisma/client";
import type {
  TravelerDocuments,
  TravelerInviteDocuments,
} from "@/types/traveler";
import { isRosterLocked } from "./travelerRoster";
import {
  PROFILE_DOCUMENTS_SELECT,
  profileTravelDocuments,
} from "./effectiveTravelDocuments";
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
      /**
       * The row's nationalities and visas with their cutoff locks. Non-null
       * ONLY for a viewer signed in with the invited address, like `invitedEmail`.
       */
      travelDocuments: TravelerInviteDocuments | null;
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
  nationalities?: string[];
  visas?: string[];
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
): Promise<
  TravelerPeek & { row?: TravelerInviteRow; documents?: TravelerInviteDocuments }
> {
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

  const locked = isRosterLocked(row.tripRequest);
  const nationalities = row.nationalities ?? [];
  const visas = row.visas ?? [];
  return {
    ok: true,
    travelerId: row.id,
    tripRequestId: row.tripRequestId,
    kind: row.kind,
    buyerFirstName: row.tripRequest.user.name.split(" ")[0],
    idDocumentRequired: !locked || !isTravelerFieldFilled(row.idDocument),
    invitedEmail: null,
    maskedEmail: maskEmail(row.email),
    viewerEmailMatches: null,
    travelDocuments: null,
    row,
    documents: {
      nationalities,
      visas,
      nationalitiesLocked: locked && nationalities.length > 0,
      visasLocked: locked && visas.length > 0,
    },
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
    travelDocuments: null,
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
    travelDocuments: matches ? (resolved.documents ?? null) : null,
  };
}

/**
 * Whether an account already uses the address this traveler was invited with,
 * so the landing page can offer "sign in" instead of "sign up". Reveals only
 * a yes/no about the invited address; the claim still checks it on submit.
 */
export async function inviteeHasAccount(travelerId: string): Promise<boolean> {
  const row = await prisma.tripTraveler.findUnique({
    where: { id: travelerId },
    select: { email: true },
  });
  const email = row?.email?.trim();
  if (!email) return false;
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  return Boolean(user);
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
    /** Validated ISO codes; `undefined` leaves the row's list unchanged. */
    nationalities?: string[];
    /** Validated visa codes; `undefined` leaves the row's list unchanged. */
    visas?: string[];
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
  // Travel documents follow the same freeze rule: after cutoff a populated
  // list is kept, and only the lists actually applied are written back.
  const rowNationalities = row.nationalities ?? [];
  const rowVisas = row.visas ?? [];
  const nationalities =
    locked && rowNationalities.length > 0 ? undefined : data.nationalities;
  const visas = locked && rowVisas.length > 0 ? undefined : data.visas;
  const now = new Date();
  try {
    const travelerUpdate = prisma.tripTraveler.update({
      where: {
        id: row.id,
        inviteTokenHash: hashToken(plaintext),
        status: row.status,
        userId: row.userId,
        fullName: row.fullName,
        email: row.email,
        idDocument: row.idDocument,
        inviteTokenExpiresAt: row.inviteTokenExpiresAt,
        ...(nationalities !== undefined && {
          nationalities: { equals: rowNationalities },
        }),
        ...(visas !== undefined && { visas: { equals: rowVisas } }),
      },
      data: {
        fullName,
        idDocument,
        email,
        ...(data.userId !== undefined && { userId: data.userId }),
        ...(nationalities !== undefined && { nationalities }),
        ...(visas !== undefined && { visas }),
        submittedAt: now,
        consentAt: now,
        status: "COMPLETE",
      },
    });
    if (
      data.userId !== undefined &&
      (data.nationalities !== undefined || data.visas !== undefined)
    ) {
      // Linked = live: once claimed, this traveler's documents are read from
      // their profile, so the submitted lists always reach it (the row's
      // cutoff freeze above only guards the trip row).
      await prisma.$transaction([
        travelerUpdate,
        prisma.user.update({
          where: { id: data.userId },
          data: {
            ...(data.nationalities !== undefined && {
              nationalities: data.nationalities,
            }),
            ...(data.visas !== undefined && { approvedVisas: data.visas }),
          },
        }),
      ]);
    } else {
      await travelerUpdate;
    }
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
 * The user's profile nationalities and visas as invite-form prefill, with the
 * same read-time conversions as `/api/user/documents`: legacy visa names
 * become codes, and empty nationalities fall back to `passportCountry`.
 */
export async function getProfileTravelDocuments(
  userId: string,
): Promise<TravelerDocuments> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: PROFILE_DOCUMENTS_SELECT,
  });
  return user ? profileTravelDocuments(user) : { nationalities: [], visas: [] };
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
