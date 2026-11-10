// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  claim: vi.fn(),
  finish: vi.fn(),
  record: vi.fn(),
  update: vi.fn(),
  find: vi.fn(),
  caption: vi.fn(),
  image: vi.fn(),
  load: vi.fn(),
  save: vi.fn(),
}));
vi.mock("../refreshSocialMessage", () => ({ refreshSocialMessage: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    socialRevisionJob: { updateMany: mocks.update },
    socialApproval: { findUnique: mocks.find },
  },
}));
vi.mock("@/lib/db/socialRevisionJobs", () => ({
  SOCIAL_JOB_LEASE_MS: 10 * 60_000,
  enabledJobKinds: () =>
    process.env.SLACK_SOCIAL_AI_ENABLED === "true"
      ? ["TRANSLATE", "REVISE"]
      : [],
  claimSocialRevision: mocks.claim,
  finishGeneratedSocialRevision: mocks.finish,
}));
vi.mock("@/lib/db/socialApprovals", () => ({
  recordSocialMessage: mocks.record,
}));
vi.mock("@/lib/ai/socialRevision", () => ({
  reviseSocialCaption: mocks.caption,
  reviseSocialArtwork: mocks.image,
}));
vi.mock("../socialAssets", () => ({
  loadSocialArtwork: mocks.load,
  saveSocialArtwork: mocks.save,
}));
import { runSocialRevision } from "../runSocialRevision";
const review = {
  id: "review",
  caption: "Original caption",
  imageUrl: "https://assets.test/v1.png",
  status: "CHANGES_REQUESTED",
};
const job = {
  id: "job",
  reviewId: "review",
  review,
  target: "caption",
  feedback: "Change this caption",
  leaseToken: "lease",
  generatedCaption: null,
  generatedImageUrls: [] as string[],
  slides: [] as number[],
};
beforeEach(() => {
  vi.resetAllMocks();
  for (const [key, value] of Object.entries({
    SLACK_SOCIAL_APPROVALS_ENABLED: "true",
    SLACK_SOCIAL_AI_ENABLED: "true",
    SLACK_SOCIAL_BOT_TOKEN: "token",
    SLACK_SOCIAL_SIGNING_SECRET: "secret",
    OPENAI_API_KEY: "test",
    OPENAI_SOCIAL_IMAGE_MODEL: "gpt-image-1",
  }))
    vi.stubEnv(key, value);
  mocks.claim.mockResolvedValue(job);
  mocks.find.mockResolvedValue(review);
  mocks.update.mockResolvedValue({ count: 1 });
  mocks.caption.mockResolvedValue("Edited caption");
  mocks.load.mockResolvedValue({
    bytes: new Uint8Array([1]),
    type: "image/png",
  });
  mocks.image.mockResolvedValue(new Uint8Array([2]));
  mocks.save.mockResolvedValue("https://assets.test/v2.png");
  mocks.finish.mockResolvedValue({ ...review, id: "new", revision: 2 });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ ok: true, ts: "123" })),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("caption-only edits never spend on images and post a fresh approval", async () => {
  await runSocialRevision();
  expect(mocks.caption).toHaveBeenCalledOnce();
  expect(mocks.image).not.toHaveBeenCalled();
  expect(mocks.finish).toHaveBeenCalledWith("job", "lease", "Edited caption", [
    review.imageUrl,
  ]);
  expect(mocks.record).toHaveBeenCalledWith("new", "123");
  expect(mocks.update).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ status: "COMPLETE" }),
    }),
  );
});
it("artwork-only edits preserve caption and use original image as edit input", async () => {
  mocks.claim.mockResolvedValue({ ...job, target: "image" });
  await runSocialRevision();
  expect(mocks.caption).not.toHaveBeenCalled();
  expect(mocks.load).toHaveBeenCalledWith(review.imageUrl);
  expect(mocks.finish).toHaveBeenCalledWith("job", "lease", review.caption, [
    "https://assets.test/v2.png",
  ]);
});
it("resumes checkpoints without repeating successful paid calls", async () => {
  mocks.claim.mockResolvedValue({
    ...job,
    target: "both",
    generatedCaption: "Stored caption",
    generatedImageUrls: ["https://assets.test/stored.png"],
  });
  await runSocialRevision();
  expect(mocks.caption).not.toHaveBeenCalled();
  expect(mocks.image).not.toHaveBeenCalled();
});
it("does not generate for stale sources or when disabled", async () => {
  mocks.find.mockResolvedValue({ status: "SUPERSEDED" });
  await runSocialRevision();
  expect(mocks.caption).not.toHaveBeenCalled();
  vi.stubEnv("SLACK_SOCIAL_AI_ENABLED", "false");
  mocks.claim.mockClear();
  await runSocialRevision();
  expect(mocks.claim).not.toHaveBeenCalled();
});
it("uncertain paid calls and uncertain Slack delivery require manual recovery", async () => {
  mocks.caption.mockRejectedValue(new Error("timeout"));
  await runSocialRevision();
  expect(mocks.update).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ status: "MANUAL_RECOVERY" }),
    }),
  );
  expect(mocks.finish).not.toHaveBeenCalled();
  expect(mocks.caption).toHaveBeenCalledOnce();
});

const carousel = {
  ...review,
  imageUrls: [
    "https://assets.test/1.png",
    "https://assets.test/2.png",
    "https://assets.test/3.png",
  ],
};
it("edits only the requested slides and keeps the others", async () => {
  mocks.claim.mockResolvedValue({
    ...job,
    review: carousel,
    target: "image",
    slides: [2],
  });
  await runSocialRevision();
  expect(mocks.image).toHaveBeenCalledOnce();
  expect(mocks.load).toHaveBeenCalledWith("https://assets.test/2.png");
  expect(mocks.save).toHaveBeenCalledWith("job", new Uint8Array([2]), 2);
  expect(mocks.finish).toHaveBeenCalledWith("job", "lease", review.caption, [
    "https://assets.test/1.png",
    "https://assets.test/v2.png",
    "https://assets.test/3.png",
  ]);
});
it("edits every slide when none are named and resumes after finished slides", async () => {
  mocks.claim.mockResolvedValue({
    ...job,
    review: carousel,
    target: "image",
    generatedImageUrls: ["https://assets.test/done-1.png"],
  });
  await runSocialRevision();
  expect(mocks.image).toHaveBeenCalledTimes(2);
  expect(mocks.update).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        generatedImageUrls: [
          "https://assets.test/done-1.png",
          "https://assets.test/v2.png",
        ],
      }),
    }),
  );
  expect(mocks.finish).toHaveBeenCalledWith("job", "lease", review.caption, [
    "https://assets.test/done-1.png",
    "https://assets.test/v2.png",
    "https://assets.test/v2.png",
  ]);
});
it("rejects slide numbers that do not exist without spending", async () => {
  mocks.claim.mockResolvedValue({
    ...job,
    review: carousel,
    target: "image",
    slides: [7],
  });
  await runSocialRevision();
  expect(mocks.image).not.toHaveBeenCalled();
  expect(mocks.update).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        status: "MANUAL_RECOVERY",
        errorCode: "SLIDES_INVALID",
      }),
    }),
  );
});
