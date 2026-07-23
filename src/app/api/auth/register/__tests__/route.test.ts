import { describe, it, expect, vi, beforeEach } from "vitest";

type RouteModule = typeof import("../route");

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/lib/auth/verificationTokens", () => ({
  issueVerificationToken: vi.fn().mockResolvedValue("plaintext-token"),
}));

vi.mock("@/lib/email", () => ({
  sendVerificationEmail: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("hashed-password") },
}));

import { prisma } from "@/lib/prisma";
import { issueVerificationToken } from "@/lib/auth/verificationTokens";
import { sendVerificationEmail } from "@/lib/email";

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
    expect(json.error).toMatch(/password/i);
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
    expect(json.error).toMatch(/email/i);
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
    expect(json.error).toMatch(/already exists/i);
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
  });
});
