import { describe, expect, it } from "vitest";
import { assertLocalTestEnvironment, parseTickArgs } from "../split-payments-tick";

describe("split-payments-tick", () => {
  it("parses --trip and --now, defaulting to a dry run at the real time", () => {
    const real = new Date("2026-10-27T10:00:00Z");
    expect(parseTickArgs([], real)).toEqual({ tripId: null, now: real });
    expect(parseTickArgs(["--trip", "trip-1", "--now", "2026-11-02T12:00:00Z"], real)).toEqual({
      tripId: "trip-1",
      now: new Date("2026-11-02T12:00:00Z"),
    });
  });

  it("rejects unknown flags and invalid dates", () => {
    expect(() => parseTickArgs(["--all"])).toThrow("Unknown argument: --all");
    expect(() => parseTickArgs(["--now", "tomorrow"])).toThrow("Invalid --now");
  });

  it("only runs against a nonproduction runtime with Stripe test keys", () => {
    expect(() => assertLocalTestEnvironment({ RT_DEPLOY_ENV: "production", STRIPE_SECRET_KEY: "sk_test_x" })).toThrow("RT_DEPLOY_ENV=nonproduction");
    expect(() => assertLocalTestEnvironment({ RT_DEPLOY_ENV: "nonproduction", STRIPE_SECRET_KEY: "sk_live_x" })).toThrow("test key");
    expect(() => assertLocalTestEnvironment({ RT_DEPLOY_ENV: "nonproduction", STRIPE_SECRET_KEY: "rk_live_x" })).toThrow("test key");
    expect(() => assertLocalTestEnvironment({ RT_DEPLOY_ENV: "nonproduction", STRIPE_SECRET_KEY: "sk_test_x" })).not.toThrow();
    expect(() => assertLocalTestEnvironment({ RT_DEPLOY_ENV: "nonproduction", STRIPE_SECRET_KEY: "rk_test_x" })).not.toThrow();
  });
});
