import { describe, it, expect, vi, beforeEach } from "vitest";

type RouteModule = typeof import("../route");

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { update: vi.fn() },
  },
}));

vi.mock("@/lib/auth/verificationTokens", () => ({
  consumeVerificationToken: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { consumeVerificationToken } from "@/lib/auth/verificationTokens";

function makePostRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/verify-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 { reason: missing } when token is absent", async () => {
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest({}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ ok: false, reason: "missing" });
    expect(consumeVerificationToken).not.toHaveBeenCalled();
  });

  it("returns 400 with the reason from consumeVerificationToken when invalid/expired/used", async () => {
    (
      consumeVerificationToken as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ ok: false, reason: "expired" });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest({ token: "abc" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ ok: false, reason: "expired" });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("sets emailVerified and returns 200 on a valid token (Scenario: valid token verifies account)", async () => {
    (
      consumeVerificationToken as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ ok: true, userId: "user-1" });
    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      email: "test@example.com",
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest({ token: "abc" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true, email: "test@example.com" });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { emailVerified: expect.any(Date) },
      select: { email: true },
    });
  });
});
