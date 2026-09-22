import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
}));

vi.mock("@/lib/auth/verificationTokens", () => ({
  issueVerificationToken: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendWelcomeEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
}));

vi.mock("@/lib/auth/accessInviteTokens", () => ({
  peekAccessInvite: vi.fn(),
  consumeAccessInvite: vi.fn(),
  resolveOAuthInviteGrant: vi.fn(),
  ACCESS_INVITE_COOKIE: "grt_tripper_invite",
}));

vi.mock("@/lib/travelers/travelerInviteTokens", () => ({
  hasLiveTravelerInviteGrant: vi.fn(),
  TRAVELER_INVITE_COOKIE: "grt_traveler_invite",
}));

import { prisma } from "@/lib/prisma";

async function getJwtCallback() {
  const mod = await import("../auth");
  return mod.authOptions.callbacks!.jwt!;
}

describe("jwt() callback — referredByTripperSlug claim (design ADR-5/ADR-6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("user present + active TRIPPER referrer -> sets claim to the referrer's slug, one findUnique call", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      referredByTripperId: "tripper-1",
      referredBy: {
        tripperSlug: "maria",
        isActive: true,
        roles: ["TRAVELER", "TRIPPER"],
      },
    });

    const jwt = await getJwtCallback();
    const token = await jwt({
      token: {},
      user: { id: "user-1", email: "alice@example.com", name: "Alice" },
      account: null,
    } as unknown as Parameters<typeof jwt>[0]);

    expect((token as Record<string, unknown>).referredByTripperSlug).toBe(
      "maria",
    );
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it("user present + referrer deactivated -> claim resolves to null (read-time liveness)", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      referredByTripperId: "tripper-1",
      referredBy: {
        tripperSlug: "maria",
        isActive: false,
        roles: ["TRAVELER", "TRIPPER"],
      },
    });

    const jwt = await getJwtCallback();
    const token = await jwt({
      token: {},
      user: { id: "user-1", email: "alice@example.com", name: "Alice" },
      account: null,
    } as unknown as Parameters<typeof jwt>[0]);

    expect(
      (token as Record<string, unknown>).referredByTripperSlug,
    ).toBeNull();
  });

  it("user present + referrer demoted (no TRIPPER role) -> claim resolves to null", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      referredByTripperId: "tripper-1",
      referredBy: {
        tripperSlug: "maria",
        isActive: true,
        roles: ["TRAVELER"],
      },
    });

    const jwt = await getJwtCallback();
    const token = await jwt({
      token: {},
      user: { id: "user-1", email: "alice@example.com", name: "Alice" },
      account: null,
    } as unknown as Parameters<typeof jwt>[0]);

    expect(
      (token as Record<string, unknown>).referredByTripperSlug,
    ).toBeNull();
  });

  it("user present + no referrer -> claim resolves to null", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      referredByTripperId: null,
      referredBy: null,
    });

    const jwt = await getJwtCallback();
    const token = await jwt({
      token: {},
      user: { id: "user-1", email: "alice@example.com", name: "Alice" },
      account: null,
    } as unknown as Parameters<typeof jwt>[0]);

    expect(
      (token as Record<string, unknown>).referredByTripperSlug,
    ).toBeNull();
  });
});

describe("jwt() callback — trigger:'update' hardening (design ADR-6, SECURITY-BLOCKING)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ignores client claims and refreshes referral data for the original authenticated user", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      referredByTripperId: "tripper-1",
      referredBy: {
        tripperSlug: "maria",
        isActive: true,
        roles: ["TRAVELER", "TRIPPER"],
      },
    });

    const originalToken = {
      id: "user-1",
      sub: "user-1",
      name: "Alice",
      email: "alice@example.com",
      picture: "https://example.com/alice.jpg",
      iat: 100,
      exp: 200,
      jti: "original-token",
      referredByTripperSlug: "old-slug",
    };
    const jwt = await getJwtCallback();
    const token = await jwt({
      token: { ...originalToken },
      trigger: "update",
      session: {
        id: "victim-admin",
        sub: "victim-admin",
        name: "Victim",
        email: "victim@example.com",
        picture: "https://example.com/forged.jpg",
        role: "admin",
        roles: ["admin"],
        hasSiteAccess: true,
        isAdmin: true,
        iat: 0,
        exp: 9999999999,
        jti: "forged-token",
        accessToken: "forged-access-token",
        user: { id: "victim-admin", role: "admin" },
        referredByTripperSlug: "rival",
      },
    } as unknown as Parameters<typeof jwt>[0]);

    expect(token).toEqual({
      ...originalToken,
      referredByTripperSlug: "maria",
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user-1" } }),
    );
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it("does not add arbitrary client session fields to the token", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      referredByTripperId: null,
      referredBy: null,
    });

    const jwt = await getJwtCallback();
    const token = await jwt({
      token: { id: "user-1" },
      trigger: "update",
      session: { refreshedAt: 12345 },
    } as unknown as Parameters<typeof jwt>[0]);

    expect(token).not.toHaveProperty("refreshedAt");
    expect((token as Record<string, unknown>).referredByTripperSlug).toBeNull();
  });

  it("recomputes the claim from the DB even when no clientSession is provided on an update trigger", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      referredByTripperId: "tripper-1",
      referredBy: {
        tripperSlug: "maria",
        isActive: true,
        roles: ["TRAVELER", "TRIPPER"],
      },
    });

    const jwt = await getJwtCallback();
    const token = await jwt({
      token: { id: "user-1" },
      trigger: "update",
      session: undefined,
    } as unknown as Parameters<typeof jwt>[0]);

    expect((token as Record<string, unknown>).referredByTripperSlug).toBe(
      "maria",
    );
  });

  it.each([
    { tripperSlug: "maria", isActive: false, roles: ["TRIPPER"] },
    { tripperSlug: "maria", isActive: true, roles: ["TRAVELER"] },
    null,
  ])(
    "clears a stale referral claim on update when the referrer is not live: %j",
    async (referredBy) => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        referredBy,
      });

      const jwt = await getJwtCallback();
      const token = await jwt({
        token: { id: "user-1", referredByTripperSlug: "maria" },
        trigger: "update",
        session: { referredByTripperSlug: "rival" },
      } as unknown as Parameters<typeof jwt>[0]);

      expect(token.referredByTripperSlug).toBeNull();
    },
  );
});
