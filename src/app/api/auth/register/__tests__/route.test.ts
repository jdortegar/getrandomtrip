import { describe, it, expect, vi, beforeEach } from "vitest";

type RouteModule = typeof import("../route");

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    waitlistEntry: { deleteMany: vi.fn() },
  },
}));

vi.mock("@/lib/auth/verificationTokens", () => ({
  issueVerificationToken: vi.fn().mockResolvedValue("plaintext-token"),
}));

vi.mock("@/lib/auth/accessInviteTokens", () => ({
  peekAccessInvite: vi.fn(),
  consumeAccessInvite: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendVerificationEmail: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("hashed-password") },
}));

vi.mock("@/lib/tripper/attribution-server", () => ({
  readAttributionSlug: vi.fn(),
  resolveReferrerId: vi.fn(),
  stampReferral: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { issueVerificationToken } from "@/lib/auth/verificationTokens";
import {
  peekAccessInvite,
  consumeAccessInvite,
} from "@/lib/auth/accessInviteTokens";
import { sendVerificationEmail } from "@/lib/email";
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

function makePostRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for a policy-violating password, creates no user and issues no token (Scenario: weak password rejected)", async () => {
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({
        name: "Ana",
        email: "ana@example.com",
        password: "abc123", // 6 chars, fails the 8+ policy
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("WEAK_PASSWORD");
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(issueVerificationToken).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid email format, creates no user and issues no token (Scenario: invalid email format rejected on register)", async () => {
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({
        name: "Ana",
        email: "not-an-email",
        password: "abc12345",
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("INVALID_EMAIL");
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(issueVerificationToken).not.toHaveBeenCalled();
  });

  it("returns 400 for a duplicate email without issuing a token (existing duplicate-handling behavior preserved)", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "existing-user",
      email: "ana@example.com",
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({
        name: "Ana",
        email: "ana@example.com",
        password: "abc12345",
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("USER_EXISTS");
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(issueVerificationToken).not.toHaveBeenCalled();
  });

  it("creates an unverified user and issues + sends an EMAIL_VERIFY token on success (Scenario: successful registration sends verification email)", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      name: "Ana",
      email: "ana@example.com",
      createdAt: new Date("2026-01-01"),
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({
        name: "Ana",
        email: "ana@example.com",
        password: "abc12345",
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Ana",
          email: "ana@example.com",
          password: "hashed-password",
        }),
      }),
    );
    // emailVerified must not be forced true on the created row
    const createArgs = (prisma.user.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(createArgs.data.emailVerified).toBeUndefined();

    expect(issueVerificationToken).toHaveBeenCalledWith(
      "user-1",
      "EMAIL_VERIFY",
    );
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      "user-1",
      "plaintext-token",
    );
    expect(json.user).toEqual(
      expect.objectContaining({ id: "user-1", email: "ana@example.com" }),
    );
    // Regression: no inviteToken in the body → no invite lookup, roles/grant untouched
    // (Prisma schema defaults apply).
    expect(peekAccessInvite).not.toHaveBeenCalled();
    expect(createArgs.data.roles).toBeUndefined();
    expect(createArgs.data.siteAccessGrantedAt).toBeUndefined();
  });

  it("grants TRAVELER+TRIPPER at create, stamps siteAccessGrantedAt, and consumes the invite + cleans up the waitlist when inviteToken peeks ok with a matching kind:TRIPPER email", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-2",
      name: "Bob",
      email: "bob@example.com",
      createdAt: new Date("2026-01-01"),
    });
    (peekAccessInvite as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      email: "bob@example.com",
      kind: "TRIPPER",
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({
        name: "Bob",
        email: "bob@example.com",
        password: "abc12345",
        inviteToken: "good-token",
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    const createArgs = (prisma.user.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(createArgs.data.roles).toEqual(
      expect.arrayContaining(["TRAVELER", "TRIPPER"]),
    );
    expect(createArgs.data.siteAccessGrantedAt).toBeInstanceOf(Date);
    expect(consumeAccessInvite).toHaveBeenCalledWith("good-token");
    expect(prisma.waitlistEntry.deleteMany).toHaveBeenCalledWith({
      where: { email: "bob@example.com" },
    });
    expect(json.user).toEqual(
      expect.objectContaining({ id: "user-2", email: "bob@example.com" }),
    );
  });

  it("grants only TRAVELER (no role), stamps siteAccessGrantedAt, and consumes+cleans up the waitlist when inviteToken peeks ok with a matching kind:SITE_ACCESS email (grantAccess widening regression)", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-4",
      name: "Dave",
      email: "dave@example.com",
      createdAt: new Date("2026-01-01"),
    });
    (peekAccessInvite as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      email: "dave@example.com",
      kind: "SITE_ACCESS",
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({
        name: "Dave",
        email: "dave@example.com",
        password: "abc12345",
        inviteToken: "good-token-site-access",
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    const createArgs = (prisma.user.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(createArgs.data.roles).toEqual(["TRAVELER"]);
    expect(createArgs.data.siteAccessGrantedAt).toBeInstanceOf(Date);
    // Regression: previously this consume+cleanup only fired on `grantTripper`,
    // leaving SITE_ACCESS tokens live after use. Now gated on `grantAccess`.
    expect(consumeAccessInvite).toHaveBeenCalledWith("good-token-site-access");
    expect(prisma.waitlistEntry.deleteMany).toHaveBeenCalledWith({
      where: { email: "dave@example.com" },
    });
    expect(json.user).toEqual(
      expect.objectContaining({ id: "user-4", email: "dave@example.com" }),
    );
  });

  it("grants only TRAVELER and does not consume/cleanup or stamp when inviteToken peeks ok but the email doesn't match", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-3",
      name: "Carol",
      email: "carol@example.com",
      createdAt: new Date("2026-01-01"),
    });
    (peekAccessInvite as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      email: "someone-else@example.com",
      kind: "TRIPPER",
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({
        name: "Carol",
        email: "carol@example.com",
        password: "abc12345",
        inviteToken: "mismatched-token",
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    const createArgs = (prisma.user.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(createArgs.data.roles).toEqual(["TRAVELER"]);
    expect(createArgs.data.siteAccessGrantedAt).toBeUndefined();
    expect(consumeAccessInvite).not.toHaveBeenCalled();
    expect(prisma.waitlistEntry.deleteMany).not.toHaveBeenCalled();
    expect(json.user).toEqual(
      expect.objectContaining({ id: "user-3", email: "carol@example.com" }),
    );
  });
});

describe("POST /api/auth/register — referral capture (auth-verification spec)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
  });

  it("Scenario: registration writes validated referral once — resolves the submitted slug and stamps the referrer id", async () => {
    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-10",
      name: "Ana",
      email: "ana@example.com",
      createdAt: new Date("2026-01-01"),
    });
    resolveReferrerIdMock.mockResolvedValue("tripper-maria-id");

    const mod = await import("../route");
    const res = await mod.POST(
      makePostRequest({
        name: "Ana",
        email: "ana@example.com",
        password: "abc12345",
        referredByTripperSlug: "maria",
      }),
    );

    expect(res.status).toBe(201);
    expect(readAttributionSlugMock).not.toHaveBeenCalled();
    expect(resolveReferrerIdMock).toHaveBeenCalledWith("maria");
    expect(stampReferralMock).toHaveBeenCalledWith(
      "user-10",
      "tripper-maria-id",
    );
  });

  it("Scenario: inactive tripper in dropdown data is rejected server-side — account still created with no referral stamped", async () => {
    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-11",
      name: "Bea",
      email: "bea@example.com",
      createdAt: new Date("2026-01-01"),
    });
    resolveReferrerIdMock.mockResolvedValue(null);

    const mod = await import("../route");
    const res = await mod.POST(
      makePostRequest({
        name: "Bea",
        email: "bea@example.com",
        password: "abc12345",
        referredByTripperSlug: "inactive-tripper",
      }),
    );

    expect(res.status).toBe(201);
    expect(resolveReferrerIdMock).toHaveBeenCalledWith("inactive-tripper");
    expect(stampReferralMock).toHaveBeenCalledWith("user-11", null);
  });

  it("explicit None (referredByTripperSlug: null) freezes null without consulting the cookie", async () => {
    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-12",
      name: "Caro",
      email: "caro@example.com",
      createdAt: new Date("2026-01-01"),
    });

    const mod = await import("../route");
    const res = await mod.POST(
      makePostRequest({
        name: "Caro",
        email: "caro@example.com",
        password: "abc12345",
        referredByTripperSlug: null,
      }),
    );

    expect(res.status).toBe(201);
    expect(readAttributionSlugMock).not.toHaveBeenCalled();
    expect(resolveReferrerIdMock).not.toHaveBeenCalled();
    expect(stampReferralMock).toHaveBeenCalledWith("user-12", null);
  });

  it("omitted referredByTripperSlug (undefined) falls back to the anonymous cookie slug", async () => {
    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-13",
      name: "Dan",
      email: "dan@example.com",
      createdAt: new Date("2026-01-01"),
    });
    readAttributionSlugMock.mockResolvedValue("carla");
    resolveReferrerIdMock.mockResolvedValue("tripper-carla-id");

    const mod = await import("../route");
    const res = await mod.POST(
      makePostRequest({
        name: "Dan",
        email: "dan@example.com",
        password: "abc12345",
      }),
    );

    expect(res.status).toBe(201);
    expect(readAttributionSlugMock).toHaveBeenCalled();
    expect(resolveReferrerIdMock).toHaveBeenCalledWith("carla");
    expect(stampReferralMock).toHaveBeenCalledWith(
      "user-13",
      "tripper-carla-id",
    );
  });

  it("a non-string referredByTripperSlug (e.g. a number) does not 500 — treated as absent, falls back to the cookie (finding #6)", async () => {
    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-15",
      name: "Frank",
      email: "frank@example.com",
      createdAt: new Date("2026-01-01"),
    });
    readAttributionSlugMock.mockResolvedValue("carla");
    resolveReferrerIdMock.mockResolvedValue("tripper-carla-id");

    const mod = await import("../route");
    const res = await mod.POST(
      makePostRequest({
        name: "Frank",
        email: "frank@example.com",
        password: "abc12345",
        referredByTripperSlug: 123,
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(readAttributionSlugMock).toHaveBeenCalled();
    expect(resolveReferrerIdMock).toHaveBeenCalledWith("carla");
    expect(stampReferralMock).toHaveBeenCalledWith(
      "user-15",
      "tripper-carla-id",
    );
    expect(json.user).toEqual(
      expect.objectContaining({ id: "user-15", email: "frank@example.com" }),
    );
  });

  it("self-referral guard: stampReferral is still invoked and delegated to reject same-id writes (guard lives in stampReferral itself)", async () => {
    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-14",
      name: "Eli",
      email: "eli@example.com",
      createdAt: new Date("2026-01-01"),
    });
    resolveReferrerIdMock.mockResolvedValue("user-14");

    const mod = await import("../route");
    const res = await mod.POST(
      makePostRequest({
        name: "Eli",
        email: "eli@example.com",
        password: "abc12345",
        referredByTripperSlug: "eli-as-tripper",
      }),
    );

    expect(res.status).toBe(201);
    // The route always delegates to stampReferral, which owns the
    // self-referral no-op guard (already unit-tested in attribution-server.test.ts).
    expect(stampReferralMock).toHaveBeenCalledWith("user-14", "user-14");
  });
});
