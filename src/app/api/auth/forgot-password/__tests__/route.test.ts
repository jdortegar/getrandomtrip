import { describe, it, expect, vi, beforeEach } from "vitest";

type RouteModule = typeof import("../route");

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/auth/verificationTokens", () => ({
  issueVerificationToken: vi.fn().mockResolvedValue("plaintext-token"),
}));

vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { issueVerificationToken } from "@/lib/auth/verificationTokens";
import { sendPasswordResetEmail } from "@/lib/email";

function makePostRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("issues + sends a reset token when the email matches a credential account (Scenario: existing email issues token silently)", async () => {
    (
      prisma.user.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: "user-1", password: "hashed" });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest({ email: "user@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(issueVerificationToken).toHaveBeenCalledWith(
      "user-1",
      "PASSWORD_RESET",
    );
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      "user-1",
      "plaintext-token",
    );
  });

  it("returns the identical generic response for an unknown email, with no token/email sent (Scenario: unknown email returns identical response)", async () => {
    (
      prisma.user.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({ email: "nobody@example.com" }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(issueVerificationToken).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("does not issue a token for an OAuth-only account (password null) even if the email matches", async () => {
    (
      prisma.user.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: "user-2", password: null });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({ email: "oauth@example.com" }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(issueVerificationToken).not.toHaveBeenCalled();
  });

  it("returns the generic response for a malformed email without touching the DB", async () => {
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest({ email: "not-an-email" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
