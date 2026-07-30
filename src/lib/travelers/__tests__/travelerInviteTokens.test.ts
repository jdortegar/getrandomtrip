import { describe, it, expect, vi, beforeEach } from "vitest";

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
} from "../travelerInviteTokens";

const DAY_MS = 24 * 60 * 60 * 1000;
const TTL_MS = 7 * DAY_MS;

const futureTrip = {
  startDate: new Date(Date.now() + 30 * DAY_MS),
  travelersLockedAt: null,
  user: { name: "Alice Buyer" },
};

const lockedTrip = {
  startDate: new Date(Date.now() + 2 * DAY_MS),
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
    expect(args.where).toEqual({ id: "trav-1" });
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

  it("returns used when the row's invite hash is already null (consumed)", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      inviteTokenHash: null,
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: futureTrip,
    });

    const result = await peekTravelerInvite("tok");

    expect(result).toEqual({ ok: false, reason: "used" });
  });

  it("returns expired for a token past inviteTokenExpiresAt", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() - 1000),
      tripRequest: futureTrip,
    });

    const result = await peekTravelerInvite("tok");

    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("returns locked when the trip is past the T-7d cutoff", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: lockedTrip,
    });

    const result = await peekTravelerInvite("tok");

    expect(result).toEqual({ ok: false, reason: "locked" });
  });

  it("returns ok + travelerId/tripRequestId/kind/buyerFirstName for a valid row, WITHOUT mutating it", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
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

  it("returns used for an already-consumed row and does not write", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      inviteTokenHash: null,
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: futureTrip,
    });

    const result = await consumeTravelerInvite("tok", {
      fullName: "X",
      idDocument: "Y",
    });

    expect(result).toEqual({ ok: false, reason: "used" });
    expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
  });

  it("returns expired without writing", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
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

  it("rejects a still-valid, unconsumed token when the trip is past cutoff (re-checked independently)", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: lockedTrip,
    });

    const result = await consumeTravelerInvite("tok", {
      fullName: "X",
      idDocument: "Y",
    });

    expect(result).toEqual({ ok: false, reason: "locked" });
    expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
  });

  it("writes identity fields, stamps submittedAt + consentAt, sets COMPLETE, and nulls the hash on a valid submission", async () => {
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      inviteTokenHash: "somehash",
      inviteTokenExpiresAt: new Date(Date.now() + 60_000),
      tripRequest: futureTrip,
    });

    const result = await consumeTravelerInvite("tok", {
      fullName: "Bob Companion",
      idDocument: "ID999",
      email: "bob@example.com",
    });

    expect(result).toEqual({
      ok: true,
      travelerId: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      buyerFirstName: "Alice",
    });

    expect(prisma.tripTraveler.update).toHaveBeenCalledTimes(1);
    const args = (prisma.tripTraveler.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(args.where).toEqual({ id: "trav-1" });
    expect(args.data.fullName).toBe("Bob Companion");
    expect(args.data.idDocument).toBe("ID999");
    expect(args.data.email).toBe("bob@example.com");
    expect(args.data.status).toBe("COMPLETE");
    expect(args.data.inviteTokenHash).toBeNull();
    expect(args.data.submittedAt).toBeInstanceOf(Date);
    expect(args.data.consentAt).toBeInstanceOf(Date);
  });
});
