import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    accessInvite: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    waitlistEntry: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import {
  issueAccessInvite,
  peekAccessInvite,
  consumeAccessInvite,
  getAccessInviteStatuses,
  stampSiteAccess,
  grantAccessAndCleanup,
  resolveOAuthInviteGrant,
  ACCESS_INVITE_COOKIE,
} from "../accessInviteTokens";

describe("ACCESS_INVITE_COOKIE", () => {
  it("keeps the legacy wire name (design ADR 5) — kind-agnostic", () => {
    expect(ACCESS_INVITE_COOKIE).toBe("grt_tripper_invite");
  });
});

describe("issueAccessInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      (ops: unknown[]) => Promise.all(ops),
    );
    (
      prisma.accessInvite.deleteMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ count: 0 });
    (
      prisma.accessInvite.create as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: "inv-1" });
  });

  it("deletes prior unconsumed invites for the email (any kind) then creates a fresh one, 7 days out, persisting kind, returning the plaintext", async () => {
    const beforeMs = Date.now();
    const plaintext = await issueAccessInvite("alice@example.com", "TRIPPER");
    const afterMs = Date.now();

    expect(typeof plaintext).toBe("string");
    expect(plaintext.length).toBeGreaterThanOrEqual(64);

    // No kind filter — invalidation is cross-kind (design ADR 3 sub-decision).
    expect(prisma.accessInvite.deleteMany).toHaveBeenCalledWith({
      where: { email: "alice@example.com", consumedAt: null },
    });
    expect(prisma.accessInvite.create).toHaveBeenCalledTimes(1);
    const createArgs = (prisma.accessInvite.create as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(createArgs.data.email).toBe("alice@example.com");
    expect(createArgs.data.kind).toBe("TRIPPER");
    expect(typeof createArgs.data.tokenHash).toBe("string");
    // The persisted value must be a hash, never the plaintext itself.
    expect(createArgs.data.tokenHash).not.toBe(plaintext);

    const TTL_MS = 7 * 24 * 60 * 60 * 1000;
    const expiresAtMs = (createArgs.data.expiresAt as Date).getTime();
    expect(expiresAtMs).toBeGreaterThanOrEqual(beforeMs + TTL_MS - 1000);
    expect(expiresAtMs).toBeLessThanOrEqual(afterMs + TTL_MS + 1000);
  });

  it("persists kind: SITE_ACCESS when issued for the waitlist flow", async () => {
    await issueAccessInvite("carol@example.com", "SITE_ACCESS");

    const createArgs = (prisma.accessInvite.create as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(createArgs.data.kind).toBe("SITE_ACCESS");
  });
});

describe("peekAccessInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invalid for an unknown token hash", async () => {
    (
      prisma.accessInvite.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    const result = await peekAccessInvite("nope");

    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("returns expired for a token past expiresAt", async () => {
    (
      prisma.accessInvite.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "row-1",
      email: "alice@example.com",
      kind: "TRIPPER",
      consumedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = await peekAccessInvite("tok");

    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("returns used for an already-consumed token", async () => {
    (
      prisma.accessInvite.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "row-1",
      email: "alice@example.com",
      kind: "TRIPPER",
      consumedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60),
    });

    const result = await peekAccessInvite("tok");

    expect(result).toEqual({ ok: false, reason: "used" });
  });

  it("returns ok + email + kind for a valid pending token, WITHOUT mutating it", async () => {
    (
      prisma.accessInvite.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "row-1",
      email: "alice@example.com",
      kind: "TRIPPER",
      consumedAt: null,
      expiresAt: new Date(Date.now() + 1000 * 60),
    });

    const result = await peekAccessInvite("tok");

    expect(result).toEqual({
      ok: true,
      email: "alice@example.com",
      kind: "TRIPPER",
    });
    expect(prisma.accessInvite.update).not.toHaveBeenCalled();
  });

  it("resolves kind: TRIPPER for a row created under the column DEFAULT (pre-existing invite)", async () => {
    (
      prisma.accessInvite.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "row-legacy",
      email: "legacy@example.com",
      kind: "TRIPPER",
      consumedAt: null,
      expiresAt: new Date(Date.now() + 1000 * 60),
    });

    const result = await peekAccessInvite("legacy-tok");

    expect(result).toEqual({
      ok: true,
      email: "legacy@example.com",
      kind: "TRIPPER",
    });
  });

  it("returns ok + kind: SITE_ACCESS for a waitlist-issued invite", async () => {
    (
      prisma.accessInvite.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "row-2",
      email: "carol@example.com",
      kind: "SITE_ACCESS",
      consumedAt: null,
      expiresAt: new Date(Date.now() + 1000 * 60),
    });

    const result = await peekAccessInvite("tok2");

    expect(result).toEqual({
      ok: true,
      email: "carol@example.com",
      kind: "SITE_ACCESS",
    });
  });
});

describe("consumeAccessInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invalid for an unknown token hash", async () => {
    (
      prisma.accessInvite.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    const result = await consumeAccessInvite("nope");

    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(prisma.accessInvite.update).not.toHaveBeenCalled();
  });

  it("returns expired for a token past expiresAt without mutating it", async () => {
    (
      prisma.accessInvite.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "row-1",
      email: "alice@example.com",
      kind: "TRIPPER",
      consumedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = await consumeAccessInvite("tok");

    expect(result).toEqual({ ok: false, reason: "expired" });
    expect(prisma.accessInvite.update).not.toHaveBeenCalled();
  });

  it("returns used for an already-consumed token", async () => {
    (
      prisma.accessInvite.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "row-1",
      email: "alice@example.com",
      kind: "TRIPPER",
      consumedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60),
    });

    const result = await consumeAccessInvite("tok");

    expect(result).toEqual({ ok: false, reason: "used" });
    expect(prisma.accessInvite.update).not.toHaveBeenCalled();
  });

  it("marks a valid token consumed and returns ok + email + kind", async () => {
    (
      prisma.accessInvite.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "row-1",
      email: "alice@example.com",
      kind: "SITE_ACCESS",
      consumedAt: null,
      expiresAt: new Date(Date.now() + 1000 * 60),
    });
    (prisma.accessInvite.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      {},
    );

    const result = await consumeAccessInvite("tok");

    expect(result).toEqual({
      ok: true,
      email: "alice@example.com",
      kind: "SITE_ACCESS",
    });
    expect(prisma.accessInvite.update).toHaveBeenCalledWith({
      where: { id: "row-1" },
      data: { consumedAt: expect.any(Date) },
    });
  });
});

describe("getAccessInviteStatuses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("batches a findMany scoped to the given emails + unconsumed rows (kind-agnostic), mapping future expiry to invited and past expiry to expired", async () => {
    (
      prisma.accessInvite.findMany as ReturnType<typeof vi.fn>
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

    const result = await getAccessInviteStatuses([
      "alice@example.com",
      "bob@example.com",
      "carol@example.com",
    ]);

    expect(prisma.accessInvite.findMany).toHaveBeenCalledWith({
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

describe("stampSiteAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stamps siteAccessGrantedAt via updateMany with the null-guard (first-grant-wins)", async () => {
    (prisma.user.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 1,
    });

    await stampSiteAccess("user-1");

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1", siteAccessGrantedAt: null },
      data: { siteAccessGrantedAt: expect.any(Date) },
    });
  });

  it("is a no-op (count: 0) on an already-granted user without throwing", async () => {
    (prisma.user.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 0,
    });

    await expect(stampSiteAccess("user-already-granted")).resolves.not.toThrow();
    expect(prisma.user.updateMany).toHaveBeenCalledTimes(1);
  });
});

describe("grantAccessAndCleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("kind TRIPPER: appends TRIPPER to roles (preserving existing), sets tripperSince, stamps site access, and deletes any matching waitlist row", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      roles: ["TRAVELER"],
      siteAccessGrantedAt: null,
    });
    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.user.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 1,
    });
    (
      prisma.waitlistEntry.deleteMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ count: 1 });

    await grantAccessAndCleanup("user-1", "alice@example.com", "TRIPPER");

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        roles: { set: expect.arrayContaining(["TRAVELER", "TRIPPER"]) },
        tripperSince: expect.any(Date),
      },
    });
    // stampSiteAccess's updateMany, first-grant-wins guard.
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1", siteAccessGrantedAt: null },
      data: { siteAccessGrantedAt: expect.any(Date) },
    });
    expect(prisma.waitlistEntry.deleteMany).toHaveBeenCalledWith({
      where: { email: "alice@example.com" },
    });
  });

  it("kind TRIPPER: does not duplicate TRIPPER or overwrite tripperSince when the user already has it", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      roles: ["TRAVELER", "TRIPPER"],
      siteAccessGrantedAt: new Date(),
    });
    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.user.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 0,
    });
    (
      prisma.waitlistEntry.deleteMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ count: 0 });

    await grantAccessAndCleanup("user-1", "alice@example.com", "TRIPPER");

    const updateArgs = (prisma.user.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(updateArgs.data.roles.set.sort()).toEqual(["TRAVELER", "TRIPPER"]);
    expect(updateArgs.data.tripperSince).toBeUndefined();
  });

  it("kind SITE_ACCESS: stamps site access and cleans up the waitlist row, WITHOUT touching roles or tripperSince", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-2",
      roles: ["TRAVELER"],
      siteAccessGrantedAt: null,
    });
    (prisma.user.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 1,
    });
    (
      prisma.waitlistEntry.deleteMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ count: 1 });

    await grantAccessAndCleanup("user-2", "dave@example.com", "SITE_ACCESS");

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: "user-2", siteAccessGrantedAt: null },
      data: { siteAccessGrantedAt: expect.any(Date) },
    });
    expect(prisma.waitlistEntry.deleteMany).toHaveBeenCalledWith({
      where: { email: "dave@example.com" },
    });
  });

  it("does not throw when there is no matching waitlist row to clean up", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-3",
      roles: ["TRAVELER"],
      siteAccessGrantedAt: null,
    });
    (prisma.user.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 1,
    });
    (
      prisma.waitlistEntry.deleteMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ count: 0 });

    await expect(
      grantAccessAndCleanup("user-3", "nobody@example.com", "SITE_ACCESS"),
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
        { ok: true, email: "bob@example.com", kind: "TRIPPER" },
        "bob@example.com",
      ),
    ).toBe(true);
  });

  it("returns false when the peek resolves ok but the email does not match (mismatch is not granted)", () => {
    expect(
      resolveOAuthInviteGrant(
        { ok: true, email: "bob@example.com", kind: "SITE_ACCESS" },
        "someone-else@example.com",
      ),
    ).toBe(false);
  });
});
