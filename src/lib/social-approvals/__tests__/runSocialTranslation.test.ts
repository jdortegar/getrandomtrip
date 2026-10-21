// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  claim: vi.fn(),
  update: vi.fn(),
  sourceUpdate: vi.fn(),
  create: vi.fn(),
  post: vi.fn(),
  refreshSource: vi.fn(),
  slides: vi.fn(),
  download: vi.fn(),
  transcreate: vi.fn(),
  translate: vi.fn(),
  save: vi.fn(),
}));
vi.mock("sharp", () => ({
  default: () => ({
    jpeg: () => ({ toBuffer: async () => Buffer.from([7]) }),
  }),
}));
vi.mock("../refreshSocialMessage", () => ({
  refreshSocialMessage: vi.fn(),
  refreshSourceMessage: m.refreshSource,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    socialRevisionJob: { updateMany: m.update },
    socialSource: { updateMany: m.sourceUpdate },
    socialApproval: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/db/socialRevisionJobs", () => ({
  enabledJobKinds: () =>
    process.env.SLACK_SOCIAL_AI_ENABLED === "true"
      ? ["TRANSLATE", "REVISE"]
      : [],
  claimSocialRevision: m.claim,
  finishGeneratedSocialRevision: vi.fn(),
}));
vi.mock("@/lib/db/socialApprovals", () => ({ createSocialApproval: m.create }));
vi.mock("../postSocialReview", () => ({ postSocialReview: m.post }));
vi.mock("../sourceMedia", async (original) => ({
  ...(await original<typeof import("../sourceMedia")>()),
  getSourceSlides: m.slides,
  downloadSourceImage: m.download,
}));
vi.mock("@/lib/ai/socialTranscreation", () => ({
  transcreatePost: m.transcreate,
  translateSlideArtwork: m.translate,
}));
vi.mock("../socialAssets", () => ({
  loadSocialArtwork: vi.fn(),
  saveSocialArtwork: m.save,
}));
import { runSocialRevision } from "../runSocialRevision";

const source = {
  id: "src",
  igMediaId: "ig-1",
  caption: "Tres pasos.",
  permalink: "https://www.instagram.com/p/DXiYOKaFxwb/",
  mediaType: "CAROUSEL_ALBUM",
  status: "TRANSLATION_QUEUED",
  messageTs: "9.9",
};
const job = {
  id: "job",
  kind: "TRANSLATE",
  source,
  review: null,
  actor: "U1",
  leaseToken: "lease",
  generatedCaption: null,
  generatedImageUrls: [] as string[],
  transcreation: null,
  slides: [],
  target: "both",
  feedback: "",
};
const plan = {
  caption: "Three steps.",
  slides: [
    { replacements: [{ from: "¿CÓMO FUNCIONA?", to: "HOW IT WORKS" }] },
    { replacements: [] },
  ],
  notes: ["Phone screen still shows the Spanish site."],
};
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.resetAllMocks();
  for (const [key, value] of Object.entries({
    SLACK_SOCIAL_APPROVALS_ENABLED: "true",
    SLACK_SOCIAL_AI_ENABLED: "true",
    SLACK_SOCIAL_BOT_TOKEN: "token",
    SLACK_SOCIAL_SIGNING_SECRET: "secret",
    OPENAI_API_KEY: "test",
    OPENAI_SOCIAL_IMAGE_MODEL: "gpt-image-2.5-sunburst",
    INSTAGRAM_PAGE_ACCESS_TOKEN: "EAAG-page-token-value-123",
  }))
    vi.stubEnv(key, value);
  m.claim.mockResolvedValue(job);
  m.update.mockResolvedValue({ count: 1 });
  m.slides.mockResolvedValue([
    "https://x.cdninstagram.com/1.jpg",
    "https://x.cdninstagram.com/2.jpg",
  ]);
  m.download.mockImplementation(async (url: string) => ({
    bytes: new Uint8Array([url.endsWith("1.jpg") ? 1 : 2]),
    type: "image/jpeg",
  }));
  m.transcreate.mockResolvedValue(plan);
  m.translate.mockResolvedValue(new Uint8Array([5]));
  m.save.mockImplementation(
    async (_job: string, _b: Uint8Array, slide: number) =>
      `https://app.test/s${slide}`,
  );
  m.create.mockResolvedValue({ row: { id: "review", revision: 1 } });
  m.post.mockResolvedValue("1.1");
  fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("translates caption and slides into one review and marks the source translated", async () => {
  await runSocialRevision();
  expect(m.transcreate).toHaveBeenCalledWith("Tres pasos.", [
    { bytes: new Uint8Array([1]), type: "image/jpeg" },
    { bytes: new Uint8Array([2]), type: "image/jpeg" },
  ]);
  expect(m.translate).toHaveBeenCalledOnce();
  expect(m.save).toHaveBeenNthCalledWith(1, "job", new Uint8Array([5]), 1);
  // A slide with no Spanish text keeps the original, stored as JPEG, without an image edit.
  expect(m.save).toHaveBeenNthCalledWith(
    2,
    "job",
    Buffer.from([7]),
    2,
    "image/jpeg",
  );
  expect(m.create).toHaveBeenCalledWith({
    reviewKey: "instagram-DXiYOKaFxwb",
    requestId: "translated-job",
    caption: "Three steps.",
    imageUrl: "https://app.test/s1",
    imageUrls: ["https://app.test/s1", "https://app.test/s2"],
    sourceId: "src",
    createdBy: "U1",
  });
  expect(m.post).toHaveBeenCalledWith(expect.anything(), {
    id: "review",
    revision: 1,
  });
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
    thread_ts: "1.1",
  });
  expect(m.sourceUpdate).toHaveBeenCalledWith({
    where: { id: "src", status: "TRANSLATION_QUEUED" },
    data: { status: "TRANSLATED" },
  });
  expect(m.update).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ status: "COMPLETE" }),
    }),
  );
});
it("resumes from stored transcreation and finished slides without repeating paid calls", async () => {
  m.claim.mockResolvedValue({
    ...job,
    generatedCaption: "Three steps.",
    transcreation: { slides: plan.slides, notes: [] },
    generatedImageUrls: ["https://app.test/s1"],
  });
  await runSocialRevision();
  expect(m.transcreate).not.toHaveBeenCalled();
  expect(m.translate).not.toHaveBeenCalled();
  expect(m.save).toHaveBeenCalledOnce();
  expect(m.create).toHaveBeenCalledWith(
    expect.objectContaining({
      imageUrls: ["https://app.test/s1", "https://app.test/s2"],
    }),
  );
});
it("fails a video post without spending and flags the source card", async () => {
  m.slides.mockRejectedValue(new Error("SOURCE_VIDEO_UNSUPPORTED"));
  await runSocialRevision();
  expect(m.transcreate).not.toHaveBeenCalled();
  expect(m.update).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        status: "MANUAL_RECOVERY",
        errorCode: "SOURCE_VIDEO_UNSUPPORTED",
      }),
    }),
  );
  expect(m.sourceUpdate).toHaveBeenCalledWith({
    where: { id: "src", status: "TRANSLATION_QUEUED" },
    data: { status: "TRANSLATION_FAILED" },
  });
  expect(m.refreshSource).toHaveBeenCalledWith(
    source,
    "TRANSLATION_FAILED",
    "U1",
  );
});
it("never posts a review when the image model is not configured", async () => {
  vi.stubEnv("OPENAI_SOCIAL_IMAGE_MODEL", "");
  await runSocialRevision();
  expect(m.transcreate).not.toHaveBeenCalled();
  expect(m.post).not.toHaveBeenCalled();
});
