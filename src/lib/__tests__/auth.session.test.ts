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

// ── Helpers ────────────────────────────────────────────────────────────────
const baseDbUser = {
  id: "user-1",
  name: "Alice",
  email: "alice@example.com",
  roles: ["TRAVELER"] as const,
  address: null,
  phone: null,
  createdAt: new Date("2026-01-01"),
  locale: "es" as const,
  travelerType: null,
  interests: [],
  dislikes: [],
  avatarUrl: null,
};

async function getSessionCallback() {
  const mod = await import("../auth");
  return mod.authOptions.callbacks!.session!;
}

describe("session() callback — hasSiteAccess derivation (design ADR 4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets hasSiteAccess: true when siteAccessGrantedAt is a non-null timestamp, via exactly one findUnique call", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseDbUser,
      siteAccessGrantedAt: new Date("2026-01-05"),
    });

    const sessionCallback = await getSessionCallback();
    const session = await sessionCallback({
      session: { user: {} },
      token: { id: "user-1" },
    } as unknown as Parameters<typeof sessionCallback>[0]) as import("next-auth").Session;

    expect(session.user!.hasSiteAccess).toBe(true);
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it("sets hasSiteAccess: false when siteAccessGrantedAt is null, via exactly one findUnique call (no extra query)", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseDbUser,
      id: "user-2",
      email: "bob@example.com",
      siteAccessGrantedAt: null,
    });

    const sessionCallback = await getSessionCallback();
    const session = await sessionCallback({
      session: { user: {} },
      token: { id: "user-2" },
    } as unknown as Parameters<typeof sessionCallback>[0]) as import("next-auth").Session;

    expect(session.user!.hasSiteAccess).toBe(false);
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });
});
