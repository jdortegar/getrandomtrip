// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  claim: vi.fn(),
  update: vi.fn(),
  jobUpdate: vi.fn(),
  approvalFind: vi.fn(),
  approvalUpdate: vi.fn(),
  approvalUpdateMany: vi.fn(),
  sourceUpdate: vi.fn(),
  refresh: vi.fn(),
  refreshSource: vi.fn(),
  profile: vi.fn(),
  load: vi.fn(),
  save: vi.fn(),
  container: vi.fn(),
  wait: vi.fn(),
  publish: vi.fn(),
  permalink: vi.fn(),
}));
vi.mock("sharp", () => ({
  default: () => ({
    resize: () => ({
      jpeg: () => ({ toBuffer: async () => Buffer.from([7]) }),
    }),
  }),
}));
vi.mock("../refreshSocialMessage", () => ({
  refreshSocialMessage: m.refresh,
  refreshSourceMessage: m.refreshSource,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    socialRevisionJob: { updateMany: m.update, update: m.jobUpdate },
    socialApproval: {
      findUnique: m.approvalFind,
      update: m.approvalUpdate,
      updateMany: m.approvalUpdateMany,
    },
    socialSource: { update: m.sourceUpdate, updateMany: vi.fn() },
  },
}));
vi.mock("@/lib/db/socialRevisionJobs", () => ({
  enabledJobKinds: () =>
    process.env.SLACK_SOCIAL_PUBLISH_ENABLED === "true" ? ["PUBLISH"] : [],
  claimSocialRevision: m.claim,
  finishGeneratedSocialRevision: vi.fn(),
}));
vi.mock("@/lib/instagram-recap/instagramClient", () => ({
  getProfile: m.profile,
  graphGet: vi.fn(),
}));
vi.mock("../socialAssets", () => ({
  loadSocialArtwork: m.load,
  saveSocialArtwork: m.save,
}));
vi.mock("../instagramPublish", () => ({
  createMediaContainer: m.container,
  waitForContainer: m.wait,
  publishContainer: m.publish,
  getPermalink: m.permalink,
}));
import { runSocialRevision } from "../runSocialRevision";

const review = {
  id: "review",
  revision: 2,
  caption: "Three steps.",
  imageUrl: "https://app.test/1.png",
  imageUrls: ["https://app.test/1.png", "https://app.test/2.png"],
  status: "PUBLISHING",
  messageTs: "5.5",
  sourceId: "src",
  decidedBy: "U1",
};
const job = {
  id: "job",
  kind: "PUBLISH",
  review,
  source: null,
  actor: "U2",
  leaseToken: "lease",
  generatedImageUrls: [] as string[],
  publishedMediaId: null as string | null,
};
beforeEach(() => {
  vi.resetAllMocks();
  for (const [key, value] of Object.entries({
    SLACK_SOCIAL_APPROVALS_ENABLED: "true",
    SLACK_SOCIAL_PUBLISH_ENABLED: "true",
    SLACK_SOCIAL_BOT_TOKEN: "token",
    SLACK_SOCIAL_SIGNING_SECRET: "secret",
    SOCIAL_TARGET_PAGE_TOKEN: "EAAG-target-token-value-123",
  }))
    vi.stubEnv(key, value);
  m.claim.mockResolvedValue(job);
  m.update.mockResolvedValue({ count: 1 });
  m.approvalFind.mockResolvedValue(review);
  m.profile.mockResolvedValue({
    userId: "ig-en",
    username: "getrandomtrip.en",
  });
  m.load.mockResolvedValue({ bytes: new Uint8Array([1]), type: "image/png" });
  m.save.mockImplementation(
    async (_j: string, _b: Uint8Array, slide: number) =>
      `https://app.test/p${slide}.jpg`,
  );
  m.container.mockResolvedValue("container");
  m.publish.mockResolvedValue("media-1");
  m.permalink.mockResolvedValue("https://www.instagram.com/p/EN1/");
  m.sourceUpdate.mockResolvedValue({ id: "src", status: "PUBLISHED" });
});
afterEach(() => vi.unstubAllEnvs());

it("publishes every slide as JPEG once and marks review and source published", async () => {
  await runSocialRevision();
  expect(m.save).toHaveBeenCalledWith("job", Buffer.from([7]), 1, "image/jpeg");
  expect(m.container).toHaveBeenCalledWith(
    "EAAG-target-token-value-123",
    "ig-en",
    ["https://app.test/p1.jpg", "https://app.test/p2.jpg"],
    "Three steps.",
  );
  expect(m.publish).toHaveBeenCalledOnce();
  expect(m.jobUpdate).toHaveBeenCalledWith({
    where: { id: "job" },
    data: { publishedMediaId: "media-1" },
  });
  expect(m.approvalUpdate).toHaveBeenCalledWith({
    where: { id: "review" },
    data: { status: "PUBLISHED" },
  });
  expect(m.refresh).toHaveBeenCalledWith(review, "PUBLISHED", {
    permalink: "https://www.instagram.com/p/EN1/",
  });
  expect(m.refreshSource).toHaveBeenCalledWith(
    { id: "src", status: "PUBLISHED" },
    "PUBLISHED",
  );
  expect(m.update).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ status: "COMPLETE" }),
    }),
  );
});
it("refuses a token for any account other than @getrandomtrip.en", async () => {
  m.profile.mockResolvedValue({
    userId: "ig-es",
    username: "getrandomtrip.es",
  });
  await runSocialRevision();
  expect(m.container).not.toHaveBeenCalled();
  expect(m.update).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ errorCode: "TARGET_ACCOUNT_MISMATCH" }),
    }),
  );
});
it("marks failures before media_publish as retryable PUBLISH_FAILED", async () => {
  m.wait.mockRejectedValue(new Error("INSTAGRAM_CONTAINER_FAILED"));
  await runSocialRevision();
  expect(m.publish).not.toHaveBeenCalled();
  expect(m.update).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        status: "MANUAL_RECOVERY",
        errorCode: "PUBLISH_FAILED",
      }),
    }),
  );
  expect(m.approvalUpdateMany).toHaveBeenCalledWith({
    where: { id: "review", status: "PUBLISHING" },
    data: { status: "PUBLISH_FAILED" },
  });
});
it("treats a failed media_publish call as unconfirmed, never as retryable", async () => {
  m.publish.mockRejectedValue(new Error("timeout"));
  await runSocialRevision();
  expect(m.update).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ errorCode: "PUBLISH_UNCONFIRMED" }),
    }),
  );
});
it("never publishes again when the media id is already recorded", async () => {
  m.claim.mockResolvedValue({ ...job, publishedMediaId: "media-1" });
  await runSocialRevision();
  expect(m.container).not.toHaveBeenCalled();
  expect(m.publish).not.toHaveBeenCalled();
  expect(m.approvalUpdate).toHaveBeenCalledWith({
    where: { id: "review" },
    data: { status: "PUBLISHED" },
  });
});
it("does nothing without the publish flag or target token", async () => {
  vi.stubEnv("SLACK_SOCIAL_PUBLISH_ENABLED", "false");
  await runSocialRevision();
  expect(m.claim).not.toHaveBeenCalled();
  vi.stubEnv("SLACK_SOCIAL_PUBLISH_ENABLED", "true");
  vi.stubEnv("SOCIAL_TARGET_PAGE_TOKEN", "");
  await runSocialRevision();
  expect(m.container).not.toHaveBeenCalled();
  expect(m.update).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ errorCode: "PUBLISH_DISABLED" }),
    }),
  );
});
