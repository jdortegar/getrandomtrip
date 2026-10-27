// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  find: vi.fn(),
  sourceCreate: vi.fn(),
  jobCreate: vi.fn(),
  lock: vi.fn(),
  budget: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (work: (tx: unknown) => unknown) =>
      work({
        socialSource: { findUnique: m.find, create: m.sourceCreate },
        socialRevisionJob: { create: m.jobCreate },
      }),
  },
}));
vi.mock("../socialApprovals", () => ({ lockSocialApproval: m.lock }));
vi.mock("../socialRevisionJobs", () => ({ dailyBudgetLeft: m.budget }));
import { importSocialReview } from "../importSocialReview";
const media = {
  id: "ig123",
  permalink: "https://www.instagram.com/p/De0IMw8jOGl/",
  caption: "source",
  mediaType: "IMAGE",
  postedAt: new Date(),
  previewUrl: null,
  accountUsername: "getrandomtrip.en",
  shortcode: "De0IMw8jOGl",
};
beforeEach(() => {
  vi.resetAllMocks();
  m.budget.mockResolvedValue(true);
  m.sourceCreate.mockResolvedValue({ id: "source" });
  m.jobCreate.mockResolvedValue({ id: "job" });
});
it("queues one initial generation linked to owned EN source but does not create a review or approval", async () => {
  expect(await importSocialReview(media, "admin", {})).toEqual({
    sourceId: "source",
    jobId: "job",
    created: true,
  });
  expect(m.sourceCreate).toHaveBeenCalledWith({
    data: expect.objectContaining({
      status: "TRANSLATION_QUEUED",
      accountUsername: "getrandomtrip.en",
      copyLocks: {},
    }),
  });
  expect(m.jobCreate).toHaveBeenCalledWith({
    data: {
      kind: "TRANSLATE",
      sourceId: "source",
      actor: "admin",
      feedback: "",
      target: "both",
    },
  });
  expect(m.lock).toHaveBeenCalledTimes(2);
});
it("replays identical assignments independent of JSONB field order, rejects changes", async () => {
  m.find.mockResolvedValue({
    id: "source",
    accountUsername: "getrandomtrip.en",
    copyLocks: { caption: "Exact", artworkHeadline: "HEADLINE" },
    job: { id: "job" },
  });
  expect(
    (
      await importSocialReview(media, "admin", {
        artworkHeadline: "HEADLINE",
        caption: "Exact",
      })
    ).created,
  ).toBe(false);
  await expect(
    importSocialReview(media, "admin", { caption: "Changed" }),
  ).rejects.toThrow("IMPORT_ASSIGNMENT_CONFLICT");
  expect(m.jobCreate).not.toHaveBeenCalled();
});
it("enforces shared daily budget before persisting new work", async () => {
  m.budget.mockResolvedValue(false);
  await expect(importSocialReview(media, "admin", {})).rejects.toThrow(
    "IMPORT_DAILY_LIMIT",
  );
  expect(m.sourceCreate).not.toHaveBeenCalled();
});
