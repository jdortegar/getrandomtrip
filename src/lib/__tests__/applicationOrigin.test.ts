import { afterEach, expect, it, vi } from "vitest";
import { getApplicationOrigin } from "../deployment";

afterEach(() => vi.unstubAllEnvs());

it("uses the canonical site only for an explicit production deployment", () => {
  vi.stubEnv("RT_DEPLOY_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_RT_PUBLIC_ORIGIN", "https://evil.test");
  expect(getApplicationOrigin()).toBe("https://getrandomtrip.com");
});

it.each([
  ["https://develop--getrandomtrip-1.netlify.app", "getrandomtrip-1"],
  [
    "https://deploy-preview-304--getrandomtrip-1.netlify.app",
    "getrandomtrip-1",
  ],
  ["http://localhost:3010", ""],
])("uses the validated deployment origin %s", (origin, site) => {
  vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
  vi.stubEnv("NEXT_PUBLIC_RT_PUBLIC_ORIGIN", origin);
  vi.stubEnv("NEXT_PUBLIC_RT_SITE_NAME", site);
  expect(getApplicationOrigin()).toBe(origin);
});

it.each([
  undefined,
  "https://getrandomtrip.com",
  "https://evil.test",
  "https://deploy-preview-1--other.netlify.app",
  "https://deploy-preview-1--getrandomtrip-1.netlify.app.evil.test",
  "https://user@develop--getrandomtrip-1.netlify.app",
  "https://develop--getrandomtrip-1.netlify.app/path",
  "https://develop--getrandomtrip-1.netlify.app?next=evil",
])("fails closed for invalid or missing metadata %s", (origin) => {
  vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
  vi.stubEnv("NEXT_PUBLIC_RT_PUBLIC_ORIGIN", origin);
  vi.stubEnv("NEXT_PUBLIC_RT_SITE_NAME", "getrandomtrip-1");
  vi.stubEnv("NEXTAUTH_URL", "https://getrandomtrip.com");
  expect(() => getApplicationOrigin()).toThrow("trusted nonproduction");
});
