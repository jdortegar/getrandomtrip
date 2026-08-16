import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
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

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  peekAccessInvite,
  consumeAccessInvite,
  resolveOAuthInviteGrant,
} from "@/lib/auth/accessInviteTokens";

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
