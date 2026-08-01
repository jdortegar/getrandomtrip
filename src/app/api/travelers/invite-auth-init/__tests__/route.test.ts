import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/travelers/travelerInviteTokens", () => ({
  peekTravelerInvite: vi.fn(),
}));

import { peekTravelerInvite } from "@/lib/travelers/travelerInviteTokens";

function makePostRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/travelers/invite-auth-init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/travelers/invite-auth-init", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 with the peek reason when the token doesn't peek ok, and sets no cookie", async () => {
    (peekTravelerInvite as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      reason: "expired",
    });

    const mod = await import("../route");
    const res = await mod.POST(makePostRequest({ token: "bad-token" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ reason: "expired" });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("sets a short-lived HttpOnly grt_traveler_invite cookie and returns ok for a live token", async () => {
    (peekTravelerInvite as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      travelerId: "trav-1",
      tripRequestId: "trip-1",
      kind: "ADULT",
      buyerFirstName: "Alice",
    });

    const mod = await import("../route");
    const res = await mod.POST(makePostRequest({ token: "good-token" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("grt_traveler_invite=good-token");
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/Max-Age=600/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).toMatch(/Secure/i);
  });

  it("returns 400 for a missing/invalid token payload", async () => {
    const res = await (await import("../route")).POST(
      makePostRequest({ token: 123 }),
    );
    expect(res.status).toBe(400);
    expect(peekTravelerInvite).not.toHaveBeenCalled();
  });
});
