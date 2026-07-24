import { describe, it, expect, vi, beforeEach } from "vitest";

type RouteModule = typeof import("../route");

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("@/lib/auth/verificationTokens", () => ({
  consumeVerificationToken: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("hashed-password") },
}));

import { prisma } from "@/lib/prisma";
import { consumeVerificationToken } from "@/lib/auth/verificationTokens";

function makePostRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 { reason: missing } when token or password is absent", async () => {
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest({ token: "abc" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ ok: false, reason: "missing" });
  });

  it("returns 400 { reason: weak_password } for a policy-violating password (Scenario: weak password rejected)", async () => {
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({ token: "abc", password: "abc123" }),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ ok: false, reason: "weak_password" });
    expect(consumeVerificationToken).not.toHaveBeenCalled();
  });

  it("returns 400 with the reason from consumeVerificationToken on reuse/expiry (Scenario: reused or expired token rejected)", async () => {
    (
      consumeVerificationToken as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ ok: false, reason: "used" });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({ token: "abc", password: "abc12345" }),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ ok: false, reason: "used" });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("updates the password hash and consumes the token on success (Scenario: successful reset)", async () => {
    (
      consumeVerificationToken as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ ok: true, userId: "user-1" });
    (
      prisma.user.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ emailVerified: new Date("2025-01-01") });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({ token: "abc", password: "abc12345" }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        password: "hashed-password",
        emailVerified: new Date("2025-01-01"),
      },
    });
  });

  it("opportunistically verifies the email when the account was still unverified", async () => {
    (
      consumeVerificationToken as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ ok: true, userId: "user-2" });
    (
      prisma.user.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ emailVerified: null });

    const mod = (await import("../route")) as RouteModule;
    await mod.POST(makePostRequest({ token: "abc", password: "abc12345" }));

    const updateArgs = (
      prisma.user.update as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];
    expect(updateArgs.data.emailVerified).toBeInstanceOf(Date);
  });
});
