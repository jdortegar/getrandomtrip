// @vitest-environment node
import { createRequire } from "node:module";
import path from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
const { cookieStore, delegate } = vi.hoisted(() => ({
  cookieStore: new Map<string, { value: string }>(),
  delegate: vi.fn(() => Response.json({ ok: true })),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => cookieStore.get(name) }),
}));
vi.mock("next-auth", () => ({
  default: () => delegate,
  getServerSession: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/email", () => ({
  sendWelcomeEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
}));
const require = createRequire(import.meta.url);
const { detectOrigin } = require(
  path.join(
    path.dirname(require.resolve("next-auth")),
    "utils/detect-origin.js",
  ),
);
const origin = "https://deploy-preview-12--getrandomtrip-1.netlify.app";
beforeEach(() => {
  cookieStore.clear();
  vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
  vi.stubEnv("NEXT_PUBLIC_RT_SITE_NAME", "getrandomtrip-1");
  vi.stubEnv("NEXT_PUBLIC_RT_PUBLIC_ORIGIN", origin);
  vi.stubEnv("NEXTAUTH_URL", "https://getrandomtrip.com");
  vi.stubEnv("NEXTAUTH_URL_INTERNAL", "https://getrandomtrip.com");
  vi.stubEnv("NEXTAUTH_SECRET", "production-secret");
  vi.stubEnv("RT_NONPRODUCTION_AUTH_SECRET", "");
  vi.stubEnv("AUTH_TRUST_HOST", "true");
  vi.stubEnv("VERCEL", undefined);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.resetModules();
});
it("can import auth without a development secret but blocks auth requests", async () => {
  vi.stubEnv("ATTRIBUTION_ENABLED", "true");
  const { authOptions } = await import("../auth");
  const { isAttributionEnabled } = await import("../tripper/attribution");
  expect(isAttributionEnabled()).toBe(false);
  const { GET } = await import("@/app/api/auth/[...nextauth]/route");
  expect(authOptions.secret).toBe("");
  expect(authOptions.providers.map((provider) => provider.id)).toEqual([
    "credentials",
  ]);
  expect(
    (
      await GET(new Request(`${origin}/api/auth/providers`) as NextRequest, {
        params: Promise.resolve({ nextauth: ["providers"] }),
      })
    ).status,
  ).toBe(503);
  expect(delegate).not.toHaveBeenCalled();
});
it("uses the same isolated session/attribution secret and actual externalized NextAuth origin", async () => {
  vi.stubEnv("RT_NONPRODUCTION_AUTH_SECRET", "private-development-secret");
  const { authOptions } = await import("../auth");
  const { getAttributionSecret } = await import("../tripper/attribution");
  const { GET } = await import("@/app/api/auth/[...nextauth]/route");
  expect(authOptions.secret).toBe("private-development-secret");
  expect(getAttributionSecret()).toBe(authOptions.secret);
  expect(detectOrigin("attacker.example", "http")).toBe(origin);
  expect(
    (
      await GET(new Request(`${origin}/api/auth/providers`) as NextRequest, {
        params: Promise.resolve({ nextauth: ["providers"] }),
      })
    ).status,
  ).toBe(200);
  expect(delegate).toHaveBeenCalledOnce();
});
it("keeps production provider configuration and inherited auth settings unchanged", async () => {
  vi.stubEnv("RT_DEPLOY_ENV", "production");
  const { authOptions } = await import("../auth");
  expect(authOptions.secret).toBeUndefined();
  expect(authOptions.providers.map((provider) => provider.id)).toEqual([
    "google",
    "credentials",
  ]);
  expect(process.env.NEXTAUTH_URL).toBe("https://getrandomtrip.com");
  expect(process.env.NEXTAUTH_URL_INTERNAL).toBe("https://getrandomtrip.com");
  expect(process.env.NEXTAUTH_SECRET).toBe("production-secret");
});

it("rejects attribution signing when its isolated secret is missing", async () => {
  const { POST } = await import("@/app/api/attribution/mode/route");
  const response = await POST(
    new Request(`${origin}/api/attribution/mode`, {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({ mode: "tripper", slug: "test-tripper" }),
    }),
  );
  expect(response.status).toBe(403);
});

it.each([
  ["grt_tripper", "readAttributionSlug"],
  ["grt_tripper_last_seen", "readLastSeenTripperSlug"],
] as const)(
  "ignores an unexpired %s cookie when the isolated secret is missing",
  async (cookie, reader) => {
    const { signAttribution } = await import("../tripper/attribution");
    const readers = await import("../tripper/attribution-server");
    // Real Web Crypto: a previously signed cookie must not import an empty key.
    const token = await signAttribution(
      "test-tripper",
      "previous-dev-secret",
      3600,
    );
    cookieStore.set(cookie, { value: token });
    for (const secret of [undefined, ""]) {
      vi.stubEnv("RT_NONPRODUCTION_AUTH_SECRET", secret);
      await expect(readers[reader]()).resolves.toBeNull();
    }
  },
);

it("preserves production verification in both actual server cookie readers", async () => {
  vi.stubEnv("RT_DEPLOY_ENV", "production");
  vi.stubEnv("RT_NONPRODUCTION_AUTH_SECRET", "different-dev-secret");
  const { signAttribution } = await import("../tripper/attribution");
  const { readAttributionSlug, readLastSeenTripperSlug } = await import(
    "../tripper/attribution-server"
  );
  const token = await signAttribution("test-tripper", "production-secret", 3600);
  cookieStore.set("grt_tripper", { value: token });
  cookieStore.set("grt_tripper_last_seen", { value: token });
  await expect(readAttributionSlug()).resolves.toBe("test-tripper");
  await expect(readLastSeenTripperSlug()).resolves.toBe("test-tripper");
});
