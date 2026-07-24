import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/tripperInviteTokens", () => ({
  peekTripperInvite: vi.fn(),
}));

import { peekTripperInvite } from "@/lib/auth/tripperInviteTokens";

function makePostRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/tripper-invite/oauth-init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/tripper-invite/oauth-init", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when the token doesn't peek ok, and sets no cookie", async () => {
    (peekTripperInvite as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      reason: "invalid",
    });

    const mod = await import("../route");
    const res = await mod.POST(makePostRequest({ token: "bad-token" }));

    expect(res.status).toBe(400);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("sets a short-lived HttpOnly grt_tripper_invite cookie and returns ok for a valid token", async () => {
    (peekTripperInvite as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      email: "bob@example.com",
    });

    const mod = await import("../route");
    const res = await mod.POST(makePostRequest({ token: "good-token" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("grt_tripper_invite=good-token");
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/Max-Age=600/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).toMatch(/Secure/i);
  });
});
