import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "crypto";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripTraveler: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  issueTravelerInvite,
  peekTravelerInvite,
  consumeTravelerInvite,
  hasLiveTravelerInviteGrant,
  TRAVELER_INVITE_COOKIE,
} from "../travelerInviteTokens";

const DAY_MS = 24 * 60 * 60 * 1000;
const TTL_MS = 7 * DAY_MS;

// Mirrors the production `hashToken` (sha256 hex) so tests can simulate a
// REAL Prisma unique-column lookup: the mock only returns a row when the
// `where.inviteTokenHash` argument matches the hash of a specific plaintext,
// instead of unconditionally returning a fixed row regardless of `where`.
function hashPlaintext(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

const futureTrip = {
  startDate: new Date(Date.now() + 30 * DAY_MS),
  endDate: new Date(Date.now() + 33 * DAY_MS),
  travelersLockedAt: null,
  user: { name: "Alice Buyer" },
};

const lockedTrip = {
  startDate: new Date(Date.now() + 2 * DAY_MS),
  endDate: new Date(Date.now() + 4 * DAY_MS),
  travelersLockedAt: null,
  user: { name: "Alice Buyer" },
};

const endedTrip = {
  startDate: new Date(Date.now() - 5 * DAY_MS),
  endDate: new Date(Date.now() - 2 * DAY_MS),
  travelersLockedAt: null,
  user: { name: "Alice Buyer" },
};

describe("issueTravelerInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.tripTraveler.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      {},
    );
  });

  it("rotates the token in place via a single update, returning the plaintext (never the hash)", async () => {
    const beforeMs = Date.now();
    const plaintext = await issueTravelerInvite("trav-1");
    const afterMs = Date.now();

    expect(typeof plaintext).toBe("string");
    expect(plaintext.length).toBeGreaterThanOrEqual(64);

    expect(prisma.tripTraveler.update).toHaveBeenCalledTimes(1);
    const args = (prisma.tripTraveler.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(args.where).toMatchObject({ id: "trav-1" });
    expect(typeof args.data.inviteTokenHash).toBe("string");
    expect(args.data.inviteTokenHash).not.toBe(plaintext);
    expect(args.data.reminderSentAt).toBeNull();
    expect(args.data.status).toBe("INVITED");

    const expiresAtMs = (args.data.inviteTokenExpiresAt as Date).getTime();
    expect(expiresAtMs).toBeGreaterThanOrEqual(beforeMs + TTL_MS - 1000);
    expect(expiresAtMs).toBeLessThanOrEqual(afterMs + TTL_MS + 1000);

    const invitedAtMs = (args.data.invitedAt as Date).getTime();
    expect(invitedAtMs).toBeGreaterThanOrEqual(beforeMs - 1000);
    expect(invitedAtMs).toBeLessThanOrEqual(afterMs + 1000);
  });

  it("issues a different hash on a resend (rotation invalidates the prior token)", async () => {
    await issueTravelerInvite("trav-1");
    const firstHash = (prisma.tripTraveler.update as ReturnType<typeof vi.fn>)
      .mock.calls[0][0].data.inviteTokenHash;

    await issueTravelerInvite("trav-1");
    const secondHash = (prisma.tripTraveler.update as ReturnType<typeof vi.fn>)
      .mock.calls[1][0].data.inviteTokenHash;

    expect(secondHash).not.toBe(firstHash);
  });
});

describe("peekTravelerInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invalid for an unknown token hash", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    const result = await peekTravelerInvite("nope");

    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("returns used for an already-consumed token — simulating a REAL Prisma unique lookup (row is only returned when where.inviteTokenHash matches the persisted hash, which is no longer nulled on consume)", async () => {
    const plaintext = "already-consumed-token";
    const persistedHash = hashPlaintext(plaintext);

    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockImplementation((args: { where: { inviteTokenHash: string } }) => {
      if (args.where.inviteTokenHash !== persistedHash) return Promise.resolve(null);
      return Promise.resolve({
        id: "trav-1",
        tripRequestId: "trip-1",
        kind: "ADULT",
        status: "COMPLETE",
        inviteTokenHash: persistedHash,
        inviteTokenExpiresAt: new Date(Date.now() + 60_000),
        tripRequest: futureTrip,
      });
    });

    const result = await peekTravelerInvite(plaintext);

    expect(result).toEqual({ ok: false, reason: "used" });
  });

  it("returns expired for a token past inviteTokenExpiresAt", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      status: "INVITED",
      fullName: "Saved Name",
      email: "saved@example.com",
      idDocument: null,
      dateOfBirth: null,
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() - 1000),
      tripRequest: futureTrip,
    });

    const result = await peekTravelerInvite("tok");

    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("accepts a populated row after the cutoff while the trip has not ended (T1)", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      status: "INVITED",
      dateOfBirth: null,
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: lockedTrip,
      fullName: "Saved Name",
      email: "saved@example.com",
      idDocument: "SAVED",
    });

    const result = await peekTravelerInvite("tok");

    expect(result).toMatchObject({ ok: true, idDocumentRequired: false });
  });

  it("returns ended once the trip end date has passed, even for an unexpired token", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      status: "INVITED",
      fullName: "Saved Name",
      email: "saved@example.com",
      idDocument: null,
      dateOfBirth: null,
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: endedTrip,
    });

    expect(await peekTravelerInvite("tok")).toEqual({ ok: false, reason: "ended" });
  });

  it("falls back to startDate when the trip has no endDate", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      status: "INVITED",
      fullName: "Saved Name",
      email: "saved@example.com",
      idDocument: null,
      dateOfBirth: null,
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: { ...endedTrip, endDate: null },
    });

    expect(await peekTravelerInvite("tok")).toEqual({ ok: false, reason: "ended" });
  });

  it("returns used (not ended or locked) when a completed row's trip has also passed cutoff — 'used' must win over 'locked'", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      status: "COMPLETE",
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: lockedTrip,
      fullName: "Saved Name",
      email: "saved@example.com",
      idDocument: "SAVED",
    });

    const result = await peekTravelerInvite("tok");

    expect(result).toEqual({ ok: false, reason: "used" });
  });

  it("returns ok + travelerId/tripRequestId/kind/buyerFirstName for a valid row, WITHOUT mutating it", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      status: "INVITED",
      fullName: "Saved Name",
      email: "saved@example.com",
      idDocument: null,
      dateOfBirth: null,
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: futureTrip,
    });

    const result = await peekTravelerInvite("tok");

    expect(result).toEqual({
      ok: true,
      travelerId: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      buyerFirstName: "Alice",
      idDocumentRequired: true,
    });
    expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
  });
});

describe("consumeTravelerInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.tripTraveler.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      {},
    );
  });

  it("returns invalid for an unknown token hash and does not write", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    const result = await consumeTravelerInvite("nope", {
      fullName: "X",
      idDocument: "Y",
    });

    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
  });

  it("returns used for an already-consumed row and does not write — simulating a REAL Prisma unique lookup by hash (the hash is no longer nulled on consume, so the row must still be findable by its original hash; `status: COMPLETE` is what now discriminates 'used')", async () => {
    const plaintext = "already-consumed-token";
    const persistedHash = hashPlaintext(plaintext);

    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockImplementation((args: { where: { inviteTokenHash: string } }) => {
      if (args.where.inviteTokenHash !== persistedHash) return Promise.resolve(null);
      return Promise.resolve({
        id: "trav-1",
        tripRequestId: "trip-1",
        kind: "ADULT",
        status: "COMPLETE",
        inviteTokenHash: persistedHash,
        inviteTokenExpiresAt: new Date(Date.now() + 60_000),
        tripRequest: futureTrip,
      });
    });

    const result = await consumeTravelerInvite(plaintext, {
      fullName: "X",
      idDocument: "Y",
    });

    expect(result).toEqual({ ok: false, reason: "used" });
    expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
  });

  it("refuses to re-consume an already-used token even on a second consume attempt with the correct plaintext", async () => {
    const plaintext = "reused-token";
    const persistedHash = hashPlaintext(plaintext);
    const completedRow = {
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT" as const,
      status: "COMPLETE" as const,
      inviteTokenHash: persistedHash,
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: futureTrip,
    };
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(completedRow);

    const first = await consumeTravelerInvite(plaintext, {
      fullName: "X",
      idDocument: "Y",
    });
    const second = await consumeTravelerInvite(plaintext, {
      fullName: "Z",
      idDocument: "W",
    });

    expect(first).toEqual({ ok: false, reason: "used" });
    expect(second).toEqual({ ok: false, reason: "used" });
    expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
  });

  it("returns expired without writing", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      status: "INVITED",
      fullName: "Saved Name",
      email: "saved@example.com",
      idDocument: null,
      dateOfBirth: null,
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() - 1000),
      tripRequest: futureTrip,
    });

    const result = await consumeTravelerInvite("tok", {
      fullName: "X",
      idDocument: "Y",
    });

    expect(result).toEqual({ ok: false, reason: "expired" });
    expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
  });

  it("accepts a still-valid token after the cutoff, linking the account but freezing populated fields (T1)", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      status: "INVITED",
      dateOfBirth: null,
      userId: null,
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: lockedTrip,
      fullName: "Saved Name",
      email: "saved@example.com",
      idDocument: "SAVED",
    });

    const result = await consumeTravelerInvite("tok", {
      fullName: "Account Name",
      idDocument: "OTHER",
      userId: "user-1",
    });

    expect(result.ok).toBe(true);
    const args = (prisma.tripTraveler.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args.data).toMatchObject({
      fullName: "Saved Name",
      idDocument: "SAVED",
      userId: "user-1",
      status: "COMPLETE",
    });
    expect(args.data.consentAt).toBeInstanceOf(Date);
  });

  it("rejects with ended after the trip end date without writing (T1)", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      status: "INVITED",
      fullName: "Saved Name",
      email: "saved@example.com",
      idDocument: null,
      dateOfBirth: null,
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: endedTrip,
    });

    const result = await consumeTravelerInvite("tok", {
      fullName: "X",
      idDocument: "Y",
    });

    expect(result).toEqual({ ok: false, reason: "ended" });
    expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
  });

  it("writes identity fields, stamps submittedAt + consentAt, sets COMPLETE, and LEAVES inviteTokenHash untouched (persisted, not nulled) on a valid submission", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      status: "INVITED",
      fullName: "Saved Name",
      email: "saved@example.com",
      idDocument: null,
      dateOfBirth: null,
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: futureTrip,
    });

    const result = await consumeTravelerInvite("tok", {
      fullName: "Bob Companion",
      idDocument: "ID999",
      email: "bob@example.com",
    });

    expect(result).toMatchObject({
      ok: true,
      travelerId: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      buyerFirstName: "Alice",
      idDocumentRequired: true,
    });

    expect(prisma.tripTraveler.update).toHaveBeenCalledTimes(1);
    const args = (prisma.tripTraveler.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(args.where).toMatchObject({ id: "trav-1" });
    expect(args.data.fullName).toBe("Bob Companion");
    expect(args.data.idDocument).toBe("ID999");
    expect(args.data.email).toBe("bob@example.com");
    expect(args.data.status).toBe("COMPLETE");
    // Must NOT null the hash on consume — the row needs to remain findable
    // by its original hash so a re-visit resolves to "used" (status ===
    // COMPLETE), not "invalid". See CRITICAL fix: resolveTravelerInvite now
    // discriminates "used" via `status`, not via hash presence.
    expect(args.data).not.toHaveProperty("inviteTokenHash");
    expect(args.data.submittedAt).toBeInstanceOf(Date);
    expect(args.data.consentAt).toBeInstanceOf(Date);
  });

  it("persists userId when given (companion-invite submission)", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      status: "INVITED",
      fullName: "Saved Name",
      email: "saved@example.com",
      idDocument: null,
      dateOfBirth: null,
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: futureTrip,
    });

    await consumeTravelerInvite("tok", {
      fullName: "Bob Companion",
      idDocument: "ID999",
      userId: "user-42",
    });

    const args = (prisma.tripTraveler.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(args.data.userId).toBe("user-42");
  });

  it("omits userId from the update payload when not given (buyer direct-fill path stays userId-free)", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      status: "INVITED",
      fullName: "Saved Name",
      email: "saved@example.com",
      idDocument: null,
      dateOfBirth: null,
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: futureTrip,
    });

    await consumeTravelerInvite("tok", {
      fullName: "Bob Companion",
      idDocument: "ID999",
    });

    const args = (prisma.tripTraveler.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(args.data).not.toHaveProperty("userId");
  });
});

describe("TRAVELER_INVITE_COOKIE", () => {
  it("is the fixed cookie name grt_traveler_invite", () => {
    expect(TRAVELER_INVITE_COOKIE).toBe("grt_traveler_invite");
  });
});

describe("hasLiveTravelerInviteGrant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false for an undefined cookie value", async () => {
    const result = await hasLiveTravelerInviteGrant(undefined);
    expect(result).toBe(false);
    expect(prisma.tripTraveler.findUnique).not.toHaveBeenCalled();
  });

  it("returns false for an invalid/unknown token", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    const result = await hasLiveTravelerInviteGrant("bogus");
    expect(result).toBe(false);
  });

  it("returns false for an expired token", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      status: "INVITED",
      fullName: "Saved Name",
      email: "saved@example.com",
      idDocument: null,
      dateOfBirth: null,
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() - 1000),
      tripRequest: futureTrip,
    });

    const result = await hasLiveTravelerInviteGrant("expired-tok");
    expect(result).toBe(false);
  });

  it("returns false for an already-consumed token", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      status: "COMPLETE",
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: futureTrip,
    });

    const result = await hasLiveTravelerInviteGrant("used-tok");
    expect(result).toBe(false);
  });

  it("returns false for a token whose trip has ended", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      status: "INVITED",
      dateOfBirth: null,
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: endedTrip,
      fullName: "Saved Name",
      email: "saved@example.com",
      idDocument: "SAVED",
    });

    const result = await hasLiveTravelerInviteGrant("locked-tok");
    expect(result).toBe(false);
  });

  it("returns true only for a live, unconsumed peek", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      status: "INVITED",
      fullName: "Saved Name",
      email: "saved@example.com",
      idDocument: null,
      dateOfBirth: null,
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: futureTrip,
    });

    const result = await hasLiveTravelerInviteGrant("live-tok");
    expect(result).toBe(true);
  });
});

describe("late companion completion", () => {
  const row = {
    id: "trav-1", tripRequestId: "trip-1", kind: "ADULT", status: "INVITED",
    fullName: "Buyer-saved Name", email: "invited@example.com", idDocument: null,
    dateOfBirth: null, inviteTokenHash: hashPlaintext("late-token"),
    inviteTokenExpiresAt: new Date(Date.now() + DAY_MS),
    tripRequest: { ...lockedTrip, type: "xsed" },
  };
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma.tripTraveler.findUnique).mockResolvedValue(row as never);
    vi.mocked(prisma.tripTraveler.update).mockResolvedValue({} as never);
  });
  it("allows a live grant after cutoff while details are missing", async () => {
    expect(await peekTravelerInvite("late-token")).toMatchObject({ ok: true, idDocumentRequired: true });
    expect(await hasLiveTravelerInviteGrant("late-token")).toBe(true);
  });
  it("fills the gap but preserves populated identity even if the authenticated account differs", async () => {
    expect((await consumeTravelerInvite("late-token", { fullName: "Account Name", email: "account@example.com", idDocument: "PASSPORT", userId: "user" })).ok).toBe(true);
    expect(prisma.tripTraveler.update).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ inviteTokenHash: hashPlaintext("late-token"), idDocument: null, status: "INVITED" }),
      data: expect.objectContaining({ fullName: row.fullName, email: row.email, idDocument: "PASSPORT", userId: "user" }),
    }));
  });
  it("does not ask for or overwrite a saved ID when a different required field is missing", async () => {
    vi.mocked(prisma.tripTraveler.findUnique).mockResolvedValue({ ...row, fullName: " ", idDocument: "SAVED" } as never);
    expect(await peekTravelerInvite("late-token")).toMatchObject({ ok: true, idDocumentRequired: false });
    expect((await consumeTravelerInvite("late-token", { fullName: "Account Name" })).ok).toBe(true);
    expect(prisma.tripTraveler.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ idDocument: "SAVED", fullName: "Account Name" }) }));
  });
  it("a concurrent completion or token rotation rejects stale submission", async () => {
    vi.mocked(prisma.tripTraveler.update).mockRejectedValue({ code: "P2025" });
    expect(await consumeTravelerInvite("late-token", { fullName: "Name", idDocument: "ID" })).toEqual({ ok: false, reason: "invalid" });
  });
});

it("does not transfer an already-linked account after cutoff when identity is incomplete", async () => {
  vi.resetAllMocks();
  vi.mocked(prisma.tripTraveler.findUnique).mockResolvedValue({ id: "trav", tripRequestId: "trip", kind: "ADULT", status: "INVITED", fullName: "Name", email: "saved@example.com", idDocument: null, dateOfBirth: null, userId: "original-account", inviteTokenHash: hashPlaintext("token"), inviteTokenExpiresAt: new Date(Date.now() + DAY_MS), tripRequest: lockedTrip } as never);
  expect(await consumeTravelerInvite("token", { fullName: "New Account", email: "new@example.com", idDocument: "ID", userId: "different-account" })).toEqual({ ok: false, reason: "invalid" });
  expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
});

it("allows the existing owner to fill a gap with an account-link compare-and-swap guard", async () => {
  vi.resetAllMocks();
  vi.mocked(prisma.tripTraveler.findUnique).mockResolvedValue({ id: "trav", tripRequestId: "trip", kind: "ADULT", status: "INVITED", fullName: "Name", email: "saved@example.com", idDocument: null, dateOfBirth: null, userId: "original-account", inviteTokenHash: hashPlaintext("token"), inviteTokenExpiresAt: new Date(Date.now() + DAY_MS), tripRequest: lockedTrip } as never);
  vi.mocked(prisma.tripTraveler.update).mockResolvedValue({} as never);
  expect((await consumeTravelerInvite("token", { fullName: "Account Name", idDocument: "ID", userId: "original-account" })).ok).toBe(true);
  expect(prisma.tripTraveler.update).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: "original-account" }), data: expect.objectContaining({ userId: "original-account", idDocument: "ID", fullName: "Name" }) }));
  vi.mocked(prisma.tripTraveler.update).mockRejectedValue({ code: "P2025" });
  expect(await consumeTravelerInvite("token", { fullName: "Account Name", idDocument: "ID", userId: "original-account" })).toEqual({ ok: false, reason: "invalid" });
});
