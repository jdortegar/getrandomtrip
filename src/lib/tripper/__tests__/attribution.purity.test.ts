import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Regression guard (design "Testing Strategy"): `attribution.ts` MUST stay
 * importable from the Edge runtime (src/proxy.ts). A single `node:crypto` or
 * `@/lib/prisma` import silently breaks Edge at deploy time, not at typecheck
 * time — this static-source check is the cheapest way to fail fast in CI.
 */
describe("attribution.ts Edge-purity guard", () => {
  const source = readFileSync(
    path.resolve(__dirname, "../attribution.ts"),
    "utf-8",
  );

  it("never imports node:crypto (or its bare 'crypto' alias)", () => {
    expect(source).not.toMatch(/from\s+["']node:crypto["']/);
    expect(source).not.toMatch(/from\s+["']crypto["']/);
    expect(source).not.toMatch(/require\(\s*["']crypto["']\s*\)/);
  });

  it("never imports @/lib/prisma", () => {
    expect(source).not.toMatch(/from\s+["']@\/lib\/prisma["']/);
  });

  it("never imports next-auth server bits", () => {
    expect(source).not.toMatch(/from\s+["']next-auth/);
    expect(source).not.toMatch(/from\s+["']next\/headers["']/);
  });
});
