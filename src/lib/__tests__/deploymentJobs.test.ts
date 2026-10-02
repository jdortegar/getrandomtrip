// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
const { work } = vi.hoisted(() => ({ work: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: work },
    xsedNotificationSignup: { findMany: work },
  },
}));
vi.mock("@/lib/db/runDocumentCleanupBatch", () => ({
  runDocumentCleanupBatch: work,
}));
vi.mock("@/lib/db/runSaleNotificationBatch", () => ({
  runSaleNotificationBatch: work,
}));
vi.mock("@/app/api/internal/destination-reveal/passes", () => ({
  runPass1: work,
  runPass2: work,
}));
vi.mock("@/app/api/internal/traveler-reminder/passes", () => ({
  runPass1: work,
  runPass2: work,
}));
vi.mock("@/app/api/internal/traveler-reminder/buyerReminder", () => ({
  runBuyerReminder: work,
}));
vi.mock("@/app/api/internal/trip-start-voucher-email/passes", () => ({
  runPass1: work,
}));
const jobs = [
  "analytics-recap",
  "destination-reveal",
  "document-cleanup",
  "sales-notifications",
  "traveler-reminder",
  "trip-start-voucher-email",
  "xsed-notify",
];
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
it.each(jobs)(
  "skips native %s before fetch, including missing identity",
  async (job) => {
    const { default: handler } = await import(
      `../../../netlify/functions/${job}.ts`
    );
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    vi.stubEnv("URL", "https://getrandomtrip.com");
    vi.stubEnv("CRON_SECRET", "inherited-production-token");
    for (const context of [undefined, "nonproduction", "unknown"]) {
      vi.stubEnv("RT_DEPLOY_ENV", context);
      expect((await handler()).status).toBe(204);
    }
    expect(fetch).not.toHaveBeenCalled();
  },
);
it.each(jobs)(
  "blocks direct %s API invocation before work despite valid secret",
  async (job) => {
    const { POST } =
      job === "xsed-notify"
        ? await import("../../app/api/internal/xsed/notify/route")
        : await import(`../../app/api/internal/${job}/route.ts`);
    vi.stubEnv("CRON_SECRET", "inherited-production-token");
    for (const context of [undefined, "nonproduction", "unknown"]) {
      vi.stubEnv("RT_DEPLOY_ENV", context);
      expect(
        (
          await POST(
            new Request("https://preview.test/api/internal/job", {
              method: "POST",
              headers: { authorization: "Bearer inherited-production-token" },
            }),
          )
        ).status,
      ).toBe(404);
    }
    expect(work).not.toHaveBeenCalled();
  },
);

it.each(jobs)("preserves production dispatch for native %s", async (job) => {
  const { default: handler } = await import(
    `../../../netlify/functions/${job}.ts`
  );
  const fetch = vi.fn().mockResolvedValue(new Response("ok"));
  vi.stubGlobal("fetch", fetch);
  vi.stubEnv("RT_DEPLOY_ENV", "production");
  vi.stubEnv("URL", "https://getrandomtrip.com");
  vi.stubEnv("CRON_SECRET", "mock-token");
  expect((await handler()).status).toBe(200);
  expect(fetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      method: "POST",
      headers: { Authorization: "Bearer mock-token" },
    }),
  );
});
