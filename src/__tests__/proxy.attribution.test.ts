import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { GRT_TRIPPER_COOKIE, signAttribution } from "@/lib/tripper/attribution";

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}));

const getTokenMock = getToken as ReturnType<typeof vi.fn>;

describe("extractParamSlug — ?tripper= query-param collision guard (PR2 review finding #1)", () => {
  it("accepts a valid tripper slug from ?tripper=", async () => {
    const { extractParamSlug } = await import("../proxy");
    const req = new NextRequest("http://localhost/blog?tripper=carla-diaz");
    expect(extractParamSlug(req)).toBe("carla-diaz");
  });

  it("ignores the pre-existing blog-link display name in ?tripper= (has a space and capital letters)", async () => {
    const { extractParamSlug } = await import("../proxy");
    const req = new NextRequest(
      `http://localhost/blog?tripperId=abc123&tripper=${encodeURIComponent("Carla Diaz")}`,
    );
    expect(extractParamSlug(req)).toBeNull();
  });

  it("still trusts the /trippers/[slug] path segment unconditionally", async () => {
    const { extractParamSlug } = await import("../proxy");
    const req = new NextRequest("http://localhost/trippers/carla-diaz");
    expect(extractParamSlug(req)).toBe("carla-diaz");
  });
});

describe("applyAttribution", () => {
  const secret = "test-secret-for-proxy-attribution";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ATTRIBUTION_ENABLED", "true");
    vi.stubEnv("NEXTAUTH_SECRET", secret);
  });

  it("is a complete no-op when ATTRIBUTION_ENABLED is not 'true'", async () => {
    vi.stubEnv("ATTRIBUTION_ENABLED", "false");
    const { applyAttribution } = await import("../proxy");
    const req = new NextRequest("http://localhost/");
    const res = NextResponse.next();

    await applyAttribution(req, res);

    expect(getTokenMock).not.toHaveBeenCalled();
    expect(res.cookies.get(GRT_TRIPPER_COOKIE)).toBeUndefined();
  });

  it("a token with referredByTripperSlug: null CLEARS a stale cookie instead of refreshing it (finding #2)", async () => {
    getTokenMock.mockResolvedValue({ referredByTripperSlug: null });
    const { applyAttribution } = await import("../proxy");

    const staleSigned = await signAttribution("stale-tripper", secret, 60);
    const req = new NextRequest("http://localhost/");
    req.cookies.set(GRT_TRIPPER_COOKIE, staleSigned);
    const res = NextResponse.next();

    await applyAttribution(req, res);

    // Cleared, not kept/refreshed — must not still carry the stale slug.
    const cleared = res.cookies.get(GRT_TRIPPER_COOKIE);
    expect(cleared?.value ?? "").toBe("");
  });

  it("a token with referredByTripperSlug: undefined (no claim) + a valid cookie KEEPS/refreshes it", async () => {
    getTokenMock.mockResolvedValue({ referredByTripperSlug: undefined });
    const { applyAttribution } = await import("../proxy");

    const signedCookie = await signAttribution("maria", secret, 60);
    const req = new NextRequest("http://localhost/");
    req.cookies.set(GRT_TRIPPER_COOKIE, signedCookie);
    const res = NextResponse.next();

    await applyAttribution(req, res);

    const kept = res.cookies.get(GRT_TRIPPER_COOKIE);
    expect(kept?.value).toMatch(/^v1\.maria\./);
  });

  it("ignores a display-name ?tripper= query param (no cookie set) but accepts a real ?tripper= slug", async () => {
    getTokenMock.mockResolvedValue(null);
    const { applyAttribution } = await import("../proxy");

    const reqDisplayName = new NextRequest(
      `http://localhost/blog?tripper=${encodeURIComponent("Carla Diaz")}`,
    );
    const resDisplayName = NextResponse.next();
    await applyAttribution(reqDisplayName, resDisplayName);
    expect(resDisplayName.cookies.get(GRT_TRIPPER_COOKIE)?.value ?? "").toBe(
      "",
    );

    const reqSlug = new NextRequest(
      "http://localhost/blog?tripper=carla-diaz",
    );
    const resSlug = NextResponse.next();
    await applyAttribution(reqSlug, resSlug);
    expect(resSlug.cookies.get(GRT_TRIPPER_COOKIE)?.value).toMatch(
      /^v1\.carla-diaz\./,
    );
  });
});
