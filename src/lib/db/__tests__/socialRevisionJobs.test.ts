// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  approvalFind: vi.fn(),
  approvalUpdate: vi.fn(),
  approvalCreate: vi.fn(),
  jobFind: vi.fn(),
  jobFirst: vi.fn(),
  count: vi.fn(),
  jobCreate: vi.fn(),
  jobUpdate: vi.fn(),
  jobUpdateMany: vi.fn(),
  lock: vi.fn(),
  sourceFind: vi.fn(),
  sourceUpdate: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (work: (tx: unknown) => unknown) =>
      work({
        socialApproval: {
          findUnique: m.approvalFind,
          update: m.approvalUpdate,
          create: m.approvalCreate,
        },
        socialSource: { findUnique: m.sourceFind, update: m.sourceUpdate },
        socialRevisionJob: {
          findUnique: m.jobFind,
          findFirst: m.jobFirst,
          count: m.count,
          create: m.jobCreate,
          update: m.jobUpdate,
          updateMany: m.jobUpdateMany,
        },
      }),
  },
}));
vi.mock("../socialApprovals", () => ({ lockSocialApproval: m.lock }));
import {
  claimSocialRevision,
  finishGeneratedSocialRevision,
  enabledJobKinds,
  queueSocialPublish,
  queueSocialRevision,
  queueSocialTranslation,
} from "../socialRevisionJobs";
const source = {
  id: "review",
  reviewKey: "first",
  revision: 1,
  status: "PENDING",
  messageTs: "123",
  createdBy: "admin",
};
const feedback = {
  id: source.id,
  messageTs: "123",
  user: "U",
  feedback: "Change title",
  target: "image" as const,
  slides: [2],
};
beforeEach(() => {
  vi.resetAllMocks();
  m.approvalFind.mockResolvedValue(source);
  m.count.mockResolvedValue(0);
  m.jobUpdateMany.mockResolvedValue({ count: 1 });
});
it("queues feedback and decision atomically while holding source and daily-budget locks", async () => {
  expect(await queueSocialRevision(feedback)).toBe("queued");
  expect(m.lock).toHaveBeenCalledTimes(2);
  expect(m.jobCreate).toHaveBeenCalledWith({
    data: {
      reviewId: "review",
      actor: "U",
      feedback: feedback.feedback,
      target: "image",
      slides: [2],
    },
  });
  expect(m.approvalUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ decision: "CHANGES_REQUESTED" }),
    }),
  );
});
it("duplicate submissions never create another job", async () => {
  m.jobFind.mockResolvedValue({ id: "existing" });
  expect(await queueSocialRevision(feedback)).toBe("queued");
  expect(m.jobCreate).not.toHaveBeenCalled();
});
it("rejects daily cost cap, terminal revisions and stale messages", async () => {
  m.count.mockResolvedValue(10);
  expect(await queueSocialRevision(feedback)).toBe("budget");
  m.approvalFind.mockResolvedValue({ ...source, revision: 5 });
  expect(await queueSocialRevision(feedback)).toBe("stale");
  m.approvalFind.mockResolvedValue({ ...source, messageTs: "other" });
  expect(await queueSocialRevision(feedback)).toBe("stale");
  expect(m.jobCreate).not.toHaveBeenCalled();
});
it("claims with compare-and-swap and moves expired paid work to manual recovery", async () => {
  m.jobFirst.mockResolvedValue({ id: "job" });
  m.jobUpdateMany.mockResolvedValue({ count: 1 });
  await claimSocialRevision(["REVISE"]);
  expect(m.jobUpdateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({ status: "RUNNING" }),
      data: expect.objectContaining({ status: "MANUAL_RECOVERY" }),
    }),
  );
  expect(m.jobFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        status: "QUEUED",
        attempts: { lt: 2 },
        kind: { in: ["REVISE"] },
      },
    }),
  );
  expect(m.jobUpdateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: "job", status: "QUEUED" },
      data: expect.objectContaining({
        attempts: { increment: 1 },
        leaseToken: expect.any(String),
      }),
    }),
  );
});
it("cannot create a generated revision for a replaced source or lost lease", async () => {
  m.jobFind.mockResolvedValue({
    id: "job",
    reviewId: "review",
    review: source,
    status: "RUNNING",
    leaseToken: "lease",
  });
  expect(
    await finishGeneratedSocialRevision("job", "other", "caption", ["url"]),
  ).toBeNull();
  expect(
    await finishGeneratedSocialRevision("job", "lease", "caption", ["url"]),
  ).toBeNull();
  expect(m.approvalCreate).not.toHaveBeenCalled();
});

it("fences ownership after the review lock before creating a generated revision", async () => {
  m.jobFind.mockResolvedValue({
    id: "job",
    reviewId: "review",
    review: source,
    status: "RUNNING",
    leaseToken: "lease",
  });
  m.approvalFind.mockResolvedValue({ ...source, status: "CHANGES_REQUESTED" });
  // The owner matched on initial read, but recovery/reclaim wins while waiting for the review lock.
  m.lock.mockImplementation(async () => {
    m.jobUpdateMany.mockResolvedValue({ count: 0 });
  });
  expect(
    await finishGeneratedSocialRevision("job", "lease", "caption", ["url"]),
  ).toBeNull();
  expect(m.jobUpdateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: "job",
        status: "RUNNING",
        leaseToken: "lease",
        leaseUntil: { gt: expect.any(Date) },
      },
    }),
  );
  expect(m.approvalCreate).not.toHaveBeenCalled();
  expect(m.approvalUpdate).not.toHaveBeenCalled();
});

it("creates the next revision with every slide and keeps the source link", async () => {
  m.jobFind.mockResolvedValue({
    id: "job",
    reviewId: "review",
    review: source,
    status: "RUNNING",
    leaseToken: "lease",
  });
  m.approvalFind.mockResolvedValue({
    ...source,
    status: "CHANGES_REQUESTED",
    sourceId: "src",
  });
  m.approvalCreate.mockResolvedValue({ id: "new" });
  await finishGeneratedSocialRevision("job", "lease", "caption", ["a", "b"]);
  expect(m.approvalCreate).toHaveBeenCalledWith({
    data: expect.objectContaining({
      revision: 2,
      imageUrl: "a",
      imageUrls: ["a", "b"],
      sourceId: "src",
    }),
  });
});
describe("queueSocialTranslation", () => {
  const announced = {
    id: "src",
    status: "ANNOUNCED",
    messageTs: "9.9",
  };
  const input = { sourceId: "src", user: "U1", messageTs: "9.9" };
  beforeEach(() => {
    m.sourceFind.mockResolvedValue(announced);
    m.jobFind.mockResolvedValue(null);
  });
  it("queues one TRANSLATE job and marks the source queued", async () => {
    expect(await queueSocialTranslation(input)).toBe("queued");
    expect(m.jobCreate).toHaveBeenCalledWith({
      data: {
        kind: "TRANSLATE",
        sourceId: "src",
        actor: "U1",
        feedback: "",
        target: "both",
      },
    });
    expect(m.sourceUpdate).toHaveBeenCalledWith({
      where: { id: "src" },
      data: { status: "TRANSLATION_QUEUED" },
    });
  });
  it("replays repeated clicks without another paid job", async () => {
    m.jobFind.mockResolvedValue({ id: "existing" });
    expect(await queueSocialTranslation(input)).toBe("queued");
    expect(m.jobCreate).not.toHaveBeenCalled();
  });
  it("shares the daily AI budget and rejects stale cards", async () => {
    m.count.mockResolvedValue(10);
    expect(await queueSocialTranslation(input)).toBe("budget");
    m.sourceFind.mockResolvedValue({ ...announced, messageTs: "other" });
    expect(await queueSocialTranslation(input)).toBe("stale");
    expect(m.jobCreate).not.toHaveBeenCalled();
  });
});

it("claims only job kinds whose flag is on", async () => {
  vi.stubEnv("SLACK_SOCIAL_AI_ENABLED", "false");
  vi.stubEnv("SLACK_SOCIAL_PUBLISH_ENABLED", "true");
  expect(enabledJobKinds()).toEqual(["PUBLISH"]);
  vi.stubEnv("SLACK_SOCIAL_PUBLISH_ENABLED", "false");
  expect(await claimSocialRevision()).toBeNull();
  expect(m.jobFirst).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
});
describe("queueSocialPublish", () => {
  const approved = { ...source, status: "APPROVED" };
  const input = { reviewId: "review", user: "U2", messageTs: "123" };
  it("queues one PUBLISH job for an approved review and marks it publishing", async () => {
    m.approvalFind.mockResolvedValue(approved);
    m.jobFind.mockResolvedValue(null);
    expect(await queueSocialPublish(input)).toBe("queued");
    expect(m.approvalUpdate).toHaveBeenCalledWith({
      where: { id: "review" },
      data: { status: "PUBLISHING" },
    });
    expect(m.jobCreate).toHaveBeenCalledWith({
      data: {
        kind: "PUBLISH",
        reviewId: "review",
        actor: "U2",
        feedback: "",
        target: "both",
      },
    });
  });
  it("never queues a second publish or publishes an unapproved review", async () => {
    m.approvalFind.mockResolvedValue(approved);
    m.jobFind.mockResolvedValue({ id: "existing" });
    expect(await queueSocialPublish(input)).toBe("queued");
    m.jobFind.mockResolvedValue(null);
    m.approvalFind.mockResolvedValue(source);
    expect(await queueSocialPublish(input)).toBe("stale");
    expect(m.jobCreate).not.toHaveBeenCalled();
  });
});
