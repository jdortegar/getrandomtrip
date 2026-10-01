import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildTravelerInviteUrl,
  getInviteOrigin,
  PRODUCTION_ORIGIN,
} from "../travelerInviteUrl";

afterEach(() => vi.unstubAllEnvs());

function stubNonproduction(origin: string | undefined, site = "getrandomtrip-1") {
  vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
  vi.stubEnv("NEXT_PUBLIC_RT_SITE_NAME", site);
  vi.stubEnv("NEXT_PUBLIC_RT_PUBLIC_ORIGIN", origin);
}

describe("getInviteOrigin", () => {
  it("is the production site in production, ignoring any public origin", () => {
    vi.stubEnv("RT_DEPLOY_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_RT_PUBLIC_ORIGIN", "https://develop--getrandomtrip-1.netlify.app");
    expect(getInviteOrigin()).toBe("https://getrandomtrip.com");
    expect(PRODUCTION_ORIGIN).toBe("https://getrandomtrip.com");
  });

  it("is the deploy origin in nonproduction", () => {
    stubNonproduction("https://develop--getrandomtrip-1.netlify.app");
    expect(getInviteOrigin()).toBe("https://develop--getrandomtrip-1.netlify.app");
  });

  it("falls back to the production site only when no valid deploy origin exists", () => {
    stubNonproduction(undefined);
    expect(getInviteOrigin()).toBe("https://getrandomtrip.com");
    stubNonproduction("https://evil.example.com");
    expect(getInviteOrigin()).toBe("https://getrandomtrip.com");
  });
});

describe("buildTravelerInviteUrl", () => {
  it("builds the locale-prefixed invite link from the deploy origin", () => {
    stubNonproduction("https://deploy-preview-12--getrandomtrip-1.netlify.app");
    expect(buildTravelerInviteUrl("en", "tok")).toBe(
      "https://deploy-preview-12--getrandomtrip-1.netlify.app/en/invite/tok",
    );
  });

  it("uses production in production", () => {
    vi.stubEnv("RT_DEPLOY_ENV", "production");
    expect(buildTravelerInviteUrl("es", "tok")).toBe("https://getrandomtrip.com/es/invite/tok");
  });
});
