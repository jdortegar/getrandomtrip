import { describe, expect, it } from "vitest";
import {
  GRT_TRIPPER_COOKIE,
  COOKIE_MAX_AGE,
  attributionCookieOptions,
  getAttributionSecret,
  isAttributionEnabled,
  isValidTripperSlug,
  resolveAttribution,
  signAttribution,
  verifyAttribution,
} from "../attribution";

describe("GRT_TRIPPER_COOKIE / COOKIE_MAX_AGE / attributionCookieOptions", () => {
  it("uses the grt_* namespace, not rt_tripper (ADR-2)", () => {
    expect(GRT_TRIPPER_COOKIE).toBe("grt_tripper");
  });

  it("TTL is 30 days in seconds (ADR-4)", () => {
    expect(COOKIE_MAX_AGE).toBe(30 * 24 * 60 * 60);
  });

  it("cookie options are httpOnly, secure, sameSite lax, path /, maxAge = COOKIE_MAX_AGE", () => {
    expect(attributionCookieOptions()).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  });
});

describe("resolveAttribution — precedence table (design Data Flow section)", () => {
  it("claim is a string slug -> force-set to claim, regardless of param/cookie", () => {
    expect(
      resolveAttribution({
        claimSlug: "carla",
        paramSlug: "maria",
        cookieSlug: "maria",
      }),
    ).toEqual({ kind: "set", slug: "carla" });
  });

  it("claim is explicit null -> clear, regardless of param/cookie", () => {
    expect(
      resolveAttribution({
        claimSlug: null,
        paramSlug: "maria",
        cookieSlug: "maria",
      }),
    ).toEqual({ kind: "clear" });
  });

  it("claim is undefined (anon/legacy token) + param present -> set to param", () => {
    expect(
      resolveAttribution({
        claimSlug: undefined,
        paramSlug: "maria",
        cookieSlug: null,
      }),
    ).toEqual({ kind: "set", slug: "maria" });
  });

  it("claim is undefined + no param + valid cookie -> keep (refresh exp)", () => {
    expect(
      resolveAttribution({
        claimSlug: undefined,
        paramSlug: null,
        cookieSlug: "maria",
      }),
    ).toEqual({ kind: "keep" });
  });

  it("claim is undefined + no param + invalid/expired cookie (already nulled by caller) -> clear", () => {
    expect(
      resolveAttribution({
        claimSlug: undefined,
        paramSlug: null,
        cookieSlug: null,
      }),
    ).toEqual({ kind: "clear" });
  });
});

describe("signAttribution / verifyAttribution round-trip", () => {
  const secret = "test-nextauth-secret";

  it("signs and verifies a slug round-trip", async () => {
    const raw = await signAttribution("maria", secret, 60);
    const verified = await verifyAttribution(raw, secret);
    expect(verified).toBe("maria");
  });

  it("round-trips a slug containing dots (tripperSlug has no dot-free format guarantee — only uniqueness is enforced at /api/user/tripper)", async () => {
    const raw = await signAttribution("j.doe", secret, 60);
    const verified = await verifyAttribution(raw, secret);
    expect(verified).toBe("j.doe");
  });

  it("rejects a tampered payload (slug swapped after signing)", async () => {
    const raw = await signAttribution("maria", secret, 60);
    const parts = raw.split(".");
    const tampered = [parts[0], "rival", parts[2], parts[3]].join(".");
    const verified = await verifyAttribution(tampered, secret);
    expect(verified).toBeNull();
  });

  it("rejects an expired token", async () => {
    const raw = await signAttribution("maria", secret, -10);
    const verified = await verifyAttribution(raw, secret);
    expect(verified).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const raw = await signAttribution("maria", secret, 60);
    const verified = await verifyAttribution(raw, "wrong-secret");
    expect(verified).toBeNull();
  });

  it("rejects undefined input", async () => {
    const verified = await verifyAttribution(undefined, secret);
    expect(verified).toBeNull();
  });

  it("rejects malformed input (wrong number of segments)", async () => {
    const verified = await verifyAttribution("not.a.valid.token.at.all", secret);
    expect(verified).toBeNull();
  });
});

describe("isValidTripperSlug (shared with /api/user/tripper, PR2 review finding #1)", () => {
  it("accepts lowercase alphanumeric segments joined by single dashes", () => {
    expect(isValidTripperSlug("carla-diaz")).toBe(true);
    expect(isValidTripperSlug("maria")).toBe(true);
    expect(isValidTripperSlug("j-doe-2")).toBe(true);
  });

  it("rejects a human-readable display name (space, capital letters) — the blog-link ?tripper= collision case", () => {
    expect(isValidTripperSlug("Carla Diaz")).toBe(false);
  });

  it("rejects dots, leading/trailing/double dashes, and uppercase", () => {
    expect(isValidTripperSlug("j.doe")).toBe(false);
    expect(isValidTripperSlug("-carla")).toBe(false);
    expect(isValidTripperSlug("carla-")).toBe(false);
    expect(isValidTripperSlug("carla--diaz")).toBe(false);
    expect(isValidTripperSlug("Carla")).toBe(false);
  });
});

describe("getAttributionSecret", () => {
  it("reads NEXTAUTH_SECRET from the environment", () => {
    const prev = process.env.NEXTAUTH_SECRET;
    process.env.NEXTAUTH_SECRET = "a-test-secret";
    expect(getAttributionSecret()).toBe("a-test-secret");
    if (prev !== undefined) {
      process.env.NEXTAUTH_SECRET = prev;
    } else {
      delete process.env.NEXTAUTH_SECRET;
    }
  });

  it("falls back to an empty string when unset", () => {
    const prev = process.env.NEXTAUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    expect(getAttributionSecret()).toBe("");
    if (prev !== undefined) process.env.NEXTAUTH_SECRET = prev;
  });
});

describe("isAttributionEnabled", () => {
  it("is false when ATTRIBUTION_ENABLED is unset", () => {
    const prev = process.env.ATTRIBUTION_ENABLED;
    delete process.env.ATTRIBUTION_ENABLED;
    expect(isAttributionEnabled()).toBe(false);
    if (prev !== undefined) process.env.ATTRIBUTION_ENABLED = prev;
  });

  it("is true only when ATTRIBUTION_ENABLED === 'true'", () => {
    const prev = process.env.ATTRIBUTION_ENABLED;
    process.env.ATTRIBUTION_ENABLED = "true";
    expect(isAttributionEnabled()).toBe(true);
    process.env.ATTRIBUTION_ENABLED = "1";
    expect(isAttributionEnabled()).toBe(false);
    if (prev !== undefined) {
      process.env.ATTRIBUTION_ENABLED = prev;
    } else {
      delete process.env.ATTRIBUTION_ENABLED;
    }
  });
});
