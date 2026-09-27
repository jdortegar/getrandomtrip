import { beforeEach, expect, it, vi } from "vitest";
import type { User } from "next-auth";
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: () => undefined })),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn(), create: vi.fn() } },
}));
vi.mock("@/lib/email", () => ({
  sendWelcomeEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
}));
vi.mock("@/lib/auth/verificationTokens", () => ({
  issueVerificationToken: vi.fn(),
}));
vi.mock("@/lib/auth/accessInviteTokens", () => ({
  peekAccessInvite: vi.fn(),
  consumeAccessInvite: vi.fn(),
  resolveOAuthInviteGrant: () => false,
  ACCESS_INVITE_COOKIE: "invite",
}));
vi.mock("@/lib/travelers/travelerInviteTokens", () => ({
  hasLiveTravelerInviteGrant: vi.fn(),
  TRAVELER_INVITE_COOKIE: "traveler",
}));
vi.mock("@/lib/tripper/attribution-server", () => ({
  readAttributionSlug: vi.fn(),
  resolveReferrerId: vi.fn(),
  stampReferral: vi.fn(),
}));
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth";

beforeEach(() => vi.clearAllMocks());
it.each([true, false])(
  "issues a server-confirmed receipt based on account creation, not button intent: new=%s",
  async (isNew) => {
    const user: User = {
      id: "google",
      email: "private@example.test",
      name: "Private",
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      isNew ? null : ({ id: "db-user" } as never),
    );
    vi.mocked(prisma.user.create).mockResolvedValue({ id: "db-user" } as never);
    const callback = authOptions.callbacks!.signIn!;
    expect(
      await callback({ user, account: { provider: "google" } } as Parameters<
        typeof callback
      >[0]),
    ).toBe(true);
    expect(user.analyticsAuthSuccess).toMatchObject({
      event: isNew ? "sign_up" : "login",
      issuedAt: expect.any(Number),
      id: expect.any(String),
    });
    expect(JSON.stringify(user.analyticsAuthSuccess)).not.toContain("private");
  },
);
it("does not issue a success receipt when authentication fails", async () => {
  const user = { id: "google", email: null, name: "Private" };
  const callback = authOptions.callbacks!.signIn!;
  expect(
    await callback({
      user,
      account: { provider: "google" },
    } as unknown as Parameters<typeof callback>[0]),
  ).toBe(false);
  expect(user).not.toHaveProperty("analyticsAuthSuccess");
});
