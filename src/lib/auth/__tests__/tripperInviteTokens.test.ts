import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripperInvite: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    waitlistEntry: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import {
  issueTripperInvite,
  peekTripperInvite,
  consumeTripperInvite,
  getTripperInviteStatuses,
  grantTripperAndCleanup,
  resolveOAuthInviteGrant,
} from "../tripperInviteTokens";

describe("issueTripperInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      (ops: unknown[]) => Promise.all(ops),
    );
    (
      prisma.tripperInvite.deleteMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ count: 0 });
    (
      prisma.tripperInvite.create as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: "inv-1" });
  });

  it("deletes prior unconsumed invites for the email then creates a fresh one, 7 days out, returning the plaintext", async () => {
    const beforeMs = Date.now();
    const plaintext = await issueTripperInvite("alice@example.com");
    const afterMs = Date.now();

    expect(typeof plaintext).toBe("string");
    expect(plaintext.length).toBeGreaterThanOrEqual(64);

    expect(prisma.tripperInvite.deleteMany).toHaveBeenCalledWith({
      where: { email: "alice@example.com", consumedAt: null },
    });
    expect(prisma.tripperInvite.create).toHaveBeenCalledTimes(1);
    const createArgs = (
      prisma.tripperInvite.create as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];
    expect(createArgs.data.email).toBe("alice@example.com");
    expect(typeof createArgs.data.tokenHash).toBe("string");
    // The persisted value must be a hash, never the plaintext itself.
    expect(createArgs.data.tokenHash).not.toBe(plaintext);

    const TTL_MS = 7 * 24 * 60 * 60 * 1000;
    const expiresAtMs = (createArgs.data.expiresAt as Date).getTime();
    expect(expiresAtMs).toBeGreaterThanOrEqual(beforeMs + TTL_MS - 1000);
    expect(expiresAtMs).toBeLessThanOrEqual(afterMs + TTL_MS + 1000);
  });
});

describe("peekTripperInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invalid for an unknown token hash", async () => {
    (
      prisma.tripperInvite.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    const result = await peekTripperInvite("nope");

    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("returns expired for a token past expiresAt", async () => {
    (
      prisma.tripperInvite.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "row-1",
      email: "alice@example.com",
      consumedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = await peekTripperInvite("tok");

    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("returns used for an already-consumed token", async () => {
    (
      prisma.tripperInvite.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "row-1",
      email: "alice@example.com",
      consumedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60),
    });

    const result = await peekTripperInvite("tok");

    expect(result).toEqual({ ok: false, reason: "used" });
  });

  it("returns ok + email for a valid pending token, WITHOUT mutating it", async () => {
    (
      prisma.tripperInvite.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "row-1",
      email: "alice@example.com",
      consumedAt: null,
      expiresAt: new Date(Date.now() + 1000 * 60),
    });

    const result = await peekTripperInvite("tok");

    expect(result).toEqual({ ok: true, email: "alice@example.com" });
    expect(prisma.tripperInvite.update).not.toHaveBeenCalled();
  });
});

describe("consumeTripperInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invalid for an unknown token hash", async () => {
    (
      prisma.tripperInvite.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    const result = await consumeTripperInvite("nope");

    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(prisma.tripperInvite.update).not.toHaveBeenCalled();
  });

  it("returns expired for a token past expiresAt without mutating it", async () => {
    (
      prisma.tripperInvite.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "row-1",
      email: "alice@example.com",
      consumedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = await consumeTripperInvite("tok");

    expect(result).toEqual({ ok: false, reason: "expired" });
    expect(prisma.tripperInvite.update).not.toHaveBeenCalled();
  });

  it("returns used for an already-consumed token", async () => {
    (
      prisma.tripperInvite.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "row-1",
      email: "alice@example.com",
      consumedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60),
    });

    const result = await consumeTripperInvite("tok");

    expect(result).toEqual({ ok: false, reason: "used" });
    expect(prisma.tripperInvite.update).not.toHaveBeenCalled();
  });

  it("marks a valid token consumed and returns ok + email", async () => {
    (
      prisma.tripperInvite.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "row-1",
      email: "alice@example.com",
      consumedAt: null,
      expiresAt: new Date(Date.now() + 1000 * 60),
    });
    (
      prisma.tripperInvite.update as ReturnType<typeof vi.fn>
    ).mockResolvedValue({});

    const result = await consumeTripperInvite("tok");

    expect(result).toEqual({ ok: true, email: "alice@example.com" });
    expect(prisma.tripperInvite.update).toHaveBeenCalledWith({
      where: { id: "row-1" },
      data: { consumedAt: expect.any(Date) },
    });
  });
});

describe("getTripperInviteStatuses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("batches a findMany scoped to the given emails + unconsumed rows, mapping future expiry to invited and past expiry to expired", async () => {
    (
      prisma.tripperInvite.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([
      {
        email: "alice@example.com",
        expiresAt: new Date(Date.now() + 1000 * 60),
      },
      {
        email: "bob@example.com",
        expiresAt: new Date(Date.now() - 1000 * 60),
      },
    ]);

    const result = await getTripperInviteStatuses([
      "alice@example.com",
      "bob@example.com",
      "carol@example.com",
    ]);

    expect(prisma.tripperInvite.findMany).toHaveBeenCalledWith({
      where: {
        email: {
          in: ["alice@example.com", "bob@example.com", "carol@example.com"],
        },
        consumedAt: null,
      },
      select: { email: true, expiresAt: true },
    });
    expect(result.get("alice@example.com")).toBe("invited");
    expect(result.get("bob@example.com")).toBe("expired");
    expect(result.has("carol@example.com")).toBe(false);
  });
});

describe("grantTripperAndCleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("appends TRIPPER to the user's roles (preserving existing) and deletes any matching waitlist row", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      roles: ["CLIENT"],
    });
    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (
      prisma.waitlistEntry.deleteMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ count: 1 });

    await grantTripperAndCleanup("user-1", "alice@example.com");

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { roles: { set: expect.arrayContaining(["CLIENT", "TRIPPER"]) } },
    });
    expect(prisma.waitlistEntry.deleteMany).toHaveBeenCalledWith({
      where: { email: "alice@example.com" },
    });
  });

  it("does not duplicate TRIPPER when the user already has it", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      roles: ["CLIENT", "TRIPPER"],
    });
    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (
      prisma.waitlistEntry.deleteMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ count: 0 });

    await grantTripperAndCleanup("user-1", "alice@example.com");

    const updateArgs = (prisma.user.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(updateArgs.data.roles.set.sort()).toEqual(["CLIENT", "TRIPPER"]);
  });

  it("does not throw when there is no matching waitlist row to clean up", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-2",
      roles: ["CLIENT"],
    });
    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (
      prisma.waitlistEntry.deleteMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ count: 0 });

    await expect(
      grantTripperAndCleanup("user-2", "nobody@example.com"),
    ).resolves.not.toThrow();
  });
});

describe("resolveOAuthInviteGrant", () => {
  it("returns false when there is no cookie/peek result at all", () => {
    expect(resolveOAuthInviteGrant(null, "bob@example.com")).toBe(false);
  });

  it("returns false when the peek did not resolve ok", () => {
    expect(
      resolveOAuthInviteGrant(
        { ok: false, reason: "expired" },
        "bob@example.com",
      ),
    ).toBe(false);
  });

  it("returns true when the peek resolves ok and matches the created email", () => {
    expect(
      resolveOAuthInviteGrant(
        { ok: true, email: "bob@example.com" },
        "bob@example.com",
      ),
    ).toBe(true);
  });

  it("returns false when the peek resolves ok but the email does not match (mismatch is not granted)", () => {
    expect(
      resolveOAuthInviteGrant(
        { ok: true, email: "bob@example.com" },
        "someone-else@example.com",
      ),
    ).toBe(false);
  });
});
