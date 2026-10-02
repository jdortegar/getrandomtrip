// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";

vi.mock("dotenv/config", () => {
  throw new Error("Importing a script must not load environment files");
});
vi.mock("@/lib/prisma", () => {
  throw new Error("Importing a script must not load the application client");
});
vi.mock("@prisma/client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@prisma/client")>();
  return {
    ...original,
    PrismaClient: vi.fn(function () {
      throw new Error(
        "Importing a script must not construct a database client",
      );
    }),
  };
});

afterEach(() => vi.unstubAllEnvs());

it.each([
  ["email verification", () => import("../backfill-email-verified")],
  ["experience source", () => import("../backfill-experience-source")],
  ["hero crop", () => import("../backfill-tripper-hero-crop")],
  ["tripper since", () => import("../backfill-tripper-since")],
  ["duplicate cleanup", () => import("../cleanup-duplicate-trip-requests")],
  ["companion invites", () => import("../backfill-companion-invites")],
  ["departure time zone", () => import("../backfill-departure-time-zone")],
] as const)(
  "imports %s without environment or database side effects",
  async (_, load) => {
    vi.stubEnv("DATABASE_URL", undefined);
    await expect(load()).resolves.toBeDefined();
  },
);
