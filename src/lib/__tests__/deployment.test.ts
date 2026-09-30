import { afterEach, expect, it, vi } from "vitest";
import {
  getAuthSecret,
  getBlobStoreName,
  getNonproductionOrigin,
  isProductionDeployment,
} from "../deployment";
import { configureAuthEnvironment } from "../auth/environment";

afterEach(() => vi.unstubAllEnvs());

it.each([undefined, "", "nonproduction", "preview", "PRODUCTION"])(
  "fails closed for deployment %s despite NODE_ENV=production",
  (context) => {
    vi.stubEnv("RT_DEPLOY_ENV", context);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXTAUTH_SECRET", "inherited-production-secret");
    vi.stubEnv("RT_NONPRODUCTION_AUTH_SECRET", "");
    expect(isProductionDeployment()).toBe(false);
    expect(getBlobStoreName("user-media")).toBe("nonproduction-user-media");
    expect(getAuthSecret()).toBe("");
  },
);

it("preserves production stores, auth secret and environment", () => {
  vi.stubEnv("RT_DEPLOY_ENV", "production");
  vi.stubEnv("NEXTAUTH_SECRET", "production-secret");
  vi.stubEnv("NEXTAUTH_URL", "https://getrandomtrip.com");
  vi.stubEnv("NEXTAUTH_URL_INTERNAL", "https://internal.example");
  configureAuthEnvironment();
  expect(isProductionDeployment()).toBe(true);
  expect(getBlobStoreName("trip-documents")).toBe("trip-documents");
  expect(getAuthSecret()).toBe("production-secret");
  expect(process.env.NEXTAUTH_URL).toBe("https://getrandomtrip.com");
  expect(process.env.NEXTAUTH_URL_INTERNAL).toBe("https://internal.example");
});

it("sets actual runtime NextAuth origins and refuses inherited host trust", () => {
  vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
  vi.stubEnv("NEXT_PUBLIC_RT_SITE_NAME", "getrandomtrip-1");
  vi.stubEnv(
    "NEXT_PUBLIC_RT_PUBLIC_ORIGIN",
    "https://deploy-preview-12--getrandomtrip-1.netlify.app",
  );
  vi.stubEnv("RT_NONPRODUCTION_AUTH_SECRET", "private-test-secret");
  vi.stubEnv("NEXTAUTH_URL", "https://getrandomtrip.com");
  vi.stubEnv("NEXTAUTH_URL_INTERNAL", "https://getrandomtrip.com");
  vi.stubEnv("AUTH_TRUST_HOST", "true");
  vi.stubEnv("VERCEL", "1");
  configureAuthEnvironment();
  expect(process.env.NEXTAUTH_URL).toBe(getNonproductionOrigin());
  expect(process.env.NEXTAUTH_URL_INTERNAL).toBe(getNonproductionOrigin());
  expect(process.env.AUTH_TRUST_HOST).toBeUndefined();
  expect(process.env.VERCEL).toBeUndefined();
  expect(getAuthSecret()).toBe("private-test-secret");
});

it.each([
  undefined,
  "https://getrandomtrip.com",
  "https://evil.example",
  "https://getrandomtrip-1.netlify.app",
  "https://develop--other-site.netlify.app",
  "https://user:pass@develop--site.netlify.app",
  "https://develop--site.netlify.app/path",
])(
  "does not fall back to production when the baked origin is invalid (%s)",
  (origin) => {
    vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
    vi.stubEnv("NEXT_PUBLIC_RT_SITE_NAME", "getrandomtrip-1");
    vi.stubEnv("NEXT_PUBLIC_RT_PUBLIC_ORIGIN", origin);
    vi.stubEnv("NEXTAUTH_URL", "https://getrandomtrip.com");
    vi.stubEnv("NEXTAUTH_URL_INTERNAL", "https://getrandomtrip.com");
    configureAuthEnvironment();
    expect(getNonproductionOrigin()).toBeNull();
    expect(process.env.NEXTAUTH_URL).toBe("");
    expect(process.env.NEXTAUTH_URL_INTERNAL).toBe("");
  },
);
