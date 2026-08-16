import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/auth/accessInviteTokens", () => ({
  consumeAccessInvite: vi.fn(),
  grantAccessAndCleanup: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import {
  consumeAccessInvite,
  grantAccessAndCleanup,
} from "@/lib/auth/accessInviteTokens";

function makePostRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/tripper-invite/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/tripper-invite/accept", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 with the reason when the token doesn't resolve", async () => {
    (consumeAccessInvite as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      reason: "expired",
    });

    const mod = await import("../route");
    const res = await mod.POST(makePostRequest({ token: "bad-token" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ reason: "expired" });
    expect(grantAccessAndCleanup).not.toHaveBeenCalled();
  });

  it("returns 409 no_account when the invite resolves but no User exists for that email", async () => {
    (consumeAccessInvite as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      email: "alice@example.com",
      kind: "TRIPPER",
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const mod = await import("../route");
    const res = await mod.POST(makePostRequest({ token: "good-token" }));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json).toEqual({ reason: "no_account" });
    expect(grantAccessAndCleanup).not.toHaveBeenCalled();
  });

  it("grants TRIPPER + cleanup for an existing user and returns ok, forwarding kind", async () => {
    (consumeAccessInvite as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      email: "alice@example.com",
      kind: "TRIPPER",
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      email: "alice@example.com",
    });

    const mod = await import("../route");
    const res = await mod.POST(makePostRequest({ token: "good-token" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(grantAccessAndCleanup).toHaveBeenCalledWith(
      "user-1",
      "alice@example.com",
      "TRIPPER",
    );
  });

  it("grants SITE_ACCESS + cleanup for an existing user and returns ok, forwarding kind", async () => {
    (consumeAccessInvite as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      email: "dave@example.com",
      kind: "SITE_ACCESS",
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-2",
      email: "dave@example.com",
    });

    const mod = await import("../route");
    const res = await mod.POST(makePostRequest({ token: "good-token-2" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(grantAccessAndCleanup).toHaveBeenCalledWith(
      "user-2",
      "dave@example.com",
      "SITE_ACCESS",
    );
  });
});
