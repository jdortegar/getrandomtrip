import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "../proxy";
import {
  GRT_TRIPPER_COOKIE,
  GRT_TRIPPER_LAST_SEEN_COOKIE,
} from "@/lib/tripper/attribution";

vi.mock("next-auth/jwt", () => ({ getToken: vi.fn() }));

const ORIGIN = "https://getrandomtrip.com";

describe("canonical traveler-type redirects with real locale middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ATTRIBUTION_ENABLED", "false");
  });

  afterEach(() => vi.unstubAllEnvs());

  it.each([
    ["/experiences/by-type/families", "/experiences/by-type/family"],
    ["/experiences/by-type/familia", "/experiences/by-type/family"],
    ["/es/experiences/by-type/families", "/experiences/by-type/family"],
    ["/es/experiences/by-type/familia", "/experiences/by-type/family"],
    ["/en/experiences/by-type/families", "/en/experiences/by-type/family"],
    ["/en/experiences/by-type/familia", "/en/experiences/by-type/family"],
  ])("permanently redirects %s directly to %s", async (path, canonical) => {
    const query = "?catalog=randomtrip&tripper=carla-diaz";
    const response = await proxy(new NextRequest(`${ORIGIN}${path}${query}`));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      `${ORIGIN}${canonical}${query}`,
    );
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(getToken).not.toHaveBeenCalled();
  });

  it.each([
    "/experiences/by-type/family",
    "/experiences/by-type/solo",
    "/experiences/by-type/unknown",
    "/experiences/by-type/constructor",
    "/experiences/by-type/toString",
  ])("preserves the Spanish locale rewrite for non-alias %s", async (path) => {
    const response = await proxy(new NextRequest(`${ORIGIN}${path}`));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      `${ORIGIN}/es${path}`,
    );
    expect(response.headers.get("x-middleware-request-x-locale")).toBe("es");
    expect(response.headers.get("x-middleware-request-x-pathname")).toBe(path);
  });

  it("keeps canonical English requests and metadata request headers intact", async () => {
    const path = "/en/experiences/by-type/family";
    const response = await proxy(new NextRequest(`${ORIGIN}${path}`));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response.headers.get("x-middleware-request-x-locale")).toBe("en");
    expect(response.headers.get("x-middleware-request-x-pathname")).toBe(path);
  });

  it("preserves default-locale normalization for a non-alias route", async () => {
    const response = await proxy(
      new NextRequest(
        `${ORIGIN}/es/experiences/by-type/family?catalog=randomtrip`,
      ),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/experiences/by-type/family?catalog=randomtrip`,
    );
  });

  it("still applies referral attribution to canonical redirects", async () => {
    vi.stubEnv("ATTRIBUTION_ENABLED", "true");
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret-for-canonical-redirect");
    vi.mocked(getToken).mockResolvedValue(null);
    const response = await proxy(
      new NextRequest(
        `${ORIGIN}/en/experiences/by-type/familia?tripper=carla-diaz`,
      ),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/en/experiences/by-type/family?tripper=carla-diaz`,
    );
    expect(getToken).toHaveBeenCalledOnce();
    expect(response.cookies.get(GRT_TRIPPER_COOKIE)?.value).toMatch(
      /^v1\.carla-diaz\./,
    );
    expect(response.cookies.get(GRT_TRIPPER_LAST_SEEN_COOKIE)?.value).toMatch(
      /^v1\.carla-diaz\./,
    );
  });
});
