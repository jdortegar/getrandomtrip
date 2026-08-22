import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    waitlistEntry: { deleteMany: vi.fn() },
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

vi.mock("@/lib/tripper/attribution-server", () => ({
  readAttributionSlug: vi.fn(),
  resolveReferrerId: vi.fn(),
  stampReferral: vi.fn(),
}));

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  peekAccessInvite,
  consumeAccessInvite,
  resolveOAuthInviteGrant,
} from "@/lib/auth/accessInviteTokens";
import {
  readAttributionSlug,
  resolveReferrerId,
  stampReferral,
} from "@/lib/tripper/attribution-server";

const readAttributionSlugMock = readAttributionSlug as ReturnType<
  typeof vi.fn
>;
const resolveReferrerIdMock = resolveReferrerId as ReturnType<typeof vi.fn>;
const stampReferralMock = stampReferral as ReturnType<typeof vi.fn>;

// ── Helpers ────────────────────────────────────────────────────────────────
function makeCookieStore(value: string | undefined) {
  return {
    get: vi.fn().mockReturnValue(value !== undefined ? { value } : undefined),
  };
}

async function getSignInCallback() {
  const mod = await import("../auth");
  return mod.authOptions.callbacks!.signIn!;
}

describe("signIn() callback — OAuth create branch grantAccess/grantTripper split (design ADR 5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("SITE_ACCESS invite: stamps siteAccessGrantedAt at create, grants no TRIPPER role, consumes token + cleans up waitlist", async () => {
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeCookieStore("good-token"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (peekAccessInvite as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      email: "dave@example.com",
      kind: "SITE_ACCESS",
    });
    (resolveOAuthInviteGrant as ReturnType<typeof vi.fn>).mockReturnValue(
      true,
    );
    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      email: "dave@example.com",
    });

    const signIn = await getSignInCallback();
    const result = await signIn({
      user: { email: "dave@example.com", name: "Dave", image: null },
      account: { provider: "google" },
    } as unknown as Parameters<typeof signIn>[0]);

    expect(result).toBe(true);
    const createArgs = (prisma.user.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(createArgs.data.siteAccessGrantedAt).toBeInstanceOf(Date);
    expect(createArgs.data.roles).toBeUndefined();
    expect(createArgs.data.tripperSince).toBeUndefined();
    expect(consumeAccessInvite).toHaveBeenCalledWith("good-token");
    expect(prisma.waitlistEntry.deleteMany).toHaveBeenCalledWith({
      where: { email: "dave@example.com" },
    });
  });

  it("TRIPPER invite: grants role + tripperSince + stamp at create, consumes token + cleans up waitlist", async () => {
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeCookieStore("good-token"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (peekAccessInvite as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      email: "erin@example.com",
      kind: "TRIPPER",
    });
    (resolveOAuthInviteGrant as ReturnType<typeof vi.fn>).mockReturnValue(
      true,
    );
    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-2",
      email: "erin@example.com",
    });

    const signIn = await getSignInCallback();
    const result = await signIn({
      user: { email: "erin@example.com", name: "Erin", image: null },
      account: { provider: "google" },
    } as unknown as Parameters<typeof signIn>[0]);

    expect(result).toBe(true);
    const createArgs = (prisma.user.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(createArgs.data.roles).toEqual(["TRAVELER", "TRIPPER"]);
    expect(createArgs.data.tripperSince).toBeInstanceOf(Date);
    expect(createArgs.data.siteAccessGrantedAt).toBeInstanceOf(Date);
    expect(consumeAccessInvite).toHaveBeenCalledWith("good-token");
    expect(prisma.waitlistEntry.deleteMany).toHaveBeenCalledWith({
      where: { email: "erin@example.com" },
    });
  });

  it("email mismatch: no role or siteAccessGrantedAt grant applied, invite stays unconsumed", async () => {
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeCookieStore("stale-token"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (peekAccessInvite as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      email: "bob@example.com",
      kind: "TRIPPER",
    });
    (resolveOAuthInviteGrant as ReturnType<typeof vi.fn>).mockReturnValue(
      false,
    );
    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-3",
      email: "someone-else@example.com",
    });

    const signIn = await getSignInCallback();
    const result = await signIn({
      user: {
        email: "someone-else@example.com",
        name: "Someone",
        image: null,
      },
      account: { provider: "google" },
    } as unknown as Parameters<typeof signIn>[0]);

    expect(result).toBe(true);
    const createArgs = (prisma.user.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(createArgs.data.roles).toBeUndefined();
    expect(createArgs.data.siteAccessGrantedAt).toBeUndefined();
    expect(consumeAccessInvite).not.toHaveBeenCalled();
    expect(prisma.waitlistEntry.deleteMany).not.toHaveBeenCalled();
  });
});

describe("signIn() callback — Google new-user creation stamps referral from the grt_tripper cookie (finding #4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("a valid grt_tripper cookie at Google new-user creation results in referredByTripperId being stamped", async () => {
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeCookieStore(undefined),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (resolveOAuthInviteGrant as ReturnType<typeof vi.fn>).mockReturnValue(
      false,
    );
    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-6",
      email: "gina@example.com",
    });
    readAttributionSlugMock.mockResolvedValue("carla");
    resolveReferrerIdMock.mockResolvedValue("tripper-carla-id");

    const signIn = await getSignInCallback();
    const result = await signIn({
      user: { email: "gina@example.com", name: "Gina", image: null },
      account: { provider: "google" },
    } as unknown as Parameters<typeof signIn>[0]);

    expect(result).toBe(true);
    expect(readAttributionSlugMock).toHaveBeenCalled();
    expect(resolveReferrerIdMock).toHaveBeenCalledWith("carla");
    expect(stampReferralMock).toHaveBeenCalledWith(
      "user-6",
      "tripper-carla-id",
    );
  });

  it("no grt_tripper cookie at Google new-user creation stamps no referral", async () => {
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeCookieStore(undefined),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (resolveOAuthInviteGrant as ReturnType<typeof vi.fn>).mockReturnValue(
      false,
    );
    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-7",
      email: "hank@example.com",
    });
    readAttributionSlugMock.mockResolvedValue(null);
    resolveReferrerIdMock.mockResolvedValue(null);

    const signIn = await getSignInCallback();
    const result = await signIn({
      user: { email: "hank@example.com", name: "Hank", image: null },
      account: { provider: "google" },
    } as unknown as Parameters<typeof signIn>[0]);

    expect(result).toBe(true);
    expect(stampReferralMock).toHaveBeenCalledWith("user-7", null);
  });
});

describe("signIn() callback — reactivates a self-deactivated account on next sign-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("existing user with deactivatedAt set: clears deactivatedAt and restores isActive", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-4",
      email: "returning@example.com",
      deactivatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const signIn = await getSignInCallback();
    const result = await signIn({
      user: { email: "returning@example.com", name: "Returning", image: null },
      account: { provider: "credentials" },
    } as unknown as Parameters<typeof signIn>[0]);

    expect(result).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      data: { deactivatedAt: null, isActive: true },
      where: { id: "user-4" },
    });
  });

  it("existing user without deactivatedAt: does not call update", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-5",
      email: "active@example.com",
      deactivatedAt: null,
    });

    const signIn = await getSignInCallback();
    const result = await signIn({
      user: { email: "active@example.com", name: "Active", image: null },
      account: { provider: "credentials" },
    } as unknown as Parameters<typeof signIn>[0]);

    expect(result).toBe(true);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
