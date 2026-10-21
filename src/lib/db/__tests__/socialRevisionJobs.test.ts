// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
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
  queueSocialRevision,
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
  await claimSocialRevision();
  expect(m.jobUpdateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({ status: "RUNNING" }),
      data: expect.objectContaining({ status: "MANUAL_RECOVERY" }),
    }),
  );
  expect(m.jobFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { status: "QUEUED", attempts: { lt: 2 } },
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
    await finishGeneratedSocialRevision("job", "other", "caption", "url"),
  ).toBeNull();
  expect(
    await finishGeneratedSocialRevision("job", "lease", "caption", "url"),
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
    await finishGeneratedSocialRevision("job", "lease", "caption", "url"),
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
