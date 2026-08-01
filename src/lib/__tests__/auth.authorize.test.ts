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

vi.mock("@/lib/auth/tripperInviteTokens", () => ({
  peekTripperInvite: vi.fn(),
  consumeTripperInvite: vi.fn(),
  resolveOAuthInviteGrant: vi.fn(),
}));

vi.mock("@/lib/travelers/travelerInviteTokens", () => ({
  hasLiveTravelerInviteGrant: vi.fn(),
  TRAVELER_INVITE_COOKIE: "grt_traveler_invite",
}));

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { hasLiveTravelerInviteGrant } from "@/lib/travelers/travelerInviteTokens";

// ── Helpers ────────────────────────────────────────────────────────────────
function makeCookieStore(value: string | undefined) {
  return {
    get: vi.fn().mockReturnValue(value !== undefined ? { value } : undefined),
  };
}

const baseUser = {
  id: "user-1",
  email: "alex@example.com",
  name: "Alex Companion",
  password: "hashed-pw",
  roles: ["TRAVELER"],
  avatarUrl: null,
  travelerType: null,
  interests: [],
  dislikes: [],
};

async function getAuthorize() {
  const mod = await import("../auth");
  const provider = mod.authOptions.providers.find(
    (p: { id?: string }) => p.id === "credentials",
  ) as unknown as {
    authorize: (credentials: unknown, req: unknown) => Promise<unknown>;
    options?: {
      authorize?: (credentials: unknown, req: unknown) => Promise<unknown>;
    };
  };
  // next-auth's `CredentialsProvider()` factory returns a stub
  // `authorize: () => null` on the top-level object; the real
  // user-supplied `authorize` only lives under `.options.authorize`
  // until NextAuth's internal init merges it in at runtime.
  return provider.options?.authorize ?? provider.authorize;
}

describe("credentials authorize() — token-gated unverified-email bypass", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  });

  it("unverified account + live invite cookie: returns a user object, does not throw", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseUser,
      emailVerified: null,
    });
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeCookieStore("live-invite-token"),
    );
    (
      hasLiveTravelerInviteGrant as ReturnType<typeof vi.fn>
    ).mockResolvedValue(true);

    const authorize = await getAuthorize();
    const result = await authorize(
      { email: baseUser.email, password: "pw" },
      {},
    );

    expect(result).toEqual({
      id: baseUser.id,
      email: baseUser.email,
      name: baseUser.name,
      image: undefined,
    });
    expect(hasLiveTravelerInviteGrant).toHaveBeenCalledWith(
      "live-invite-token",
    );
  });

  it("unverified account + NO cookie: throws EMAIL_NOT_VERIFIED unchanged", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseUser,
      emailVerified: null,
    });
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeCookieStore(undefined),
    );
    (
      hasLiveTravelerInviteGrant as ReturnType<typeof vi.fn>
    ).mockResolvedValue(false);

    const authorize = await getAuthorize();

    await expect(
      authorize({ email: baseUser.email, password: "pw" }, {}),
    ).rejects.toThrow("EMAIL_NOT_VERIFIED");
  });

  it("unverified account + expired/consumed/locked cookie: throws EMAIL_NOT_VERIFIED unchanged", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseUser,
      emailVerified: null,
    });
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeCookieStore("stale-token"),
    );
    (
      hasLiveTravelerInviteGrant as ReturnType<typeof vi.fn>
    ).mockResolvedValue(false);

    const authorize = await getAuthorize();

    await expect(
      authorize({ email: baseUser.email, password: "pw" }, {}),
    ).rejects.toThrow("EMAIL_NOT_VERIFIED");
    expect(hasLiveTravelerInviteGrant).toHaveBeenCalledWith("stale-token");
  });

  it("verified user: cookie present is irrelevant, unchanged success path", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseUser,
      emailVerified: new Date(),
    });
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeCookieStore("live-invite-token"),
    );

    const authorize = await getAuthorize();
    const result = await authorize(
      { email: baseUser.email, password: "pw" },
      {},
    );

    expect(result).toEqual({
      id: baseUser.id,
      email: baseUser.email,
      name: baseUser.name,
      image: undefined,
    });
    expect(hasLiveTravelerInviteGrant).not.toHaveBeenCalled();
  });

  it("verified user: cookie absent, unchanged success path", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseUser,
      emailVerified: new Date(),
    });
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeCookieStore(undefined),
    );

    const authorize = await getAuthorize();
    const result = await authorize(
      { email: baseUser.email, password: "pw" },
      {},
    );

    expect(result).toEqual({
      id: baseUser.id,
      email: baseUser.email,
      name: baseUser.name,
      image: undefined,
    });
    expect(hasLiveTravelerInviteGrant).not.toHaveBeenCalled();
  });
});
