// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  create: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: async (work: (tx: unknown) => unknown) =>
      work({ $queryRaw: mocks.query, socialApproval: mocks }),
    socialApproval: { updateMany: mocks.updateMany },
  },
}));
import {
  createSocialApproval,
  decideSocialApproval,
  recordSocialMessage,
} from "../socialApprovals";
const input = {
  reviewKey: "first-post",
  requestId: "unique-request-id",
  caption: "caption",
  imageUrl: "https://assets.test/v1.png",
  createdBy: "admin",
};
const row = {
  ...input,
  id: "review",
  revision: 1,
  status: "PENDING",
  messageTs: "123.456",
};
const action = {
  id: "review",
  messageTs: "123.456",
  user: "U1",
  status: "APPROVED" as const,
  responseUrl: "https://hooks.slack.com/actions/x",
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.findUnique.mockResolvedValue(row);
  mocks.update.mockResolvedValue({ ...row, status: "APPROVED" });
});
it("records first decision under shared transaction lock", async () => {
  await decideSocialApproval(action);
  expect(mocks.query).toHaveBeenCalledOnce();
  expect(mocks.query.mock.calls[0][0].join("?")).toContain("))::text");
  expect(mocks.update).toHaveBeenCalledWith({
    where: { id: row.id },
    data: {
      decision: "APPROVED",
      status: "APPROVED",
      decidedBy: "U1",
      decidedAt: expect.any(Date),
    },
  });
});
it("does not overwrite a prior or competing decision", async () => {
  mocks.findUnique.mockResolvedValue({ ...row, status: "CHANGES_REQUESTED" });
  expect((await decideSocialApproval(action))?.status).toBe(
    "CHANGES_REQUESTED",
  );
  expect(mocks.update).not.toHaveBeenCalled();
});
it("rejects superseded, unposted, and different-message actions", async () => {
  for (const patch of [
    { status: "SUPERSEDED" },
    { status: "POSTING" },
    { messageTs: "other" },
  ]) {
    mocks.findUnique.mockResolvedValue({ ...row, ...patch });
    expect(await decideSocialApproval(action)).toBeNull();
  }
  expect(mocks.update).not.toHaveBeenCalled();
});
it("returns identical creation retries without re-posting and rejects key reuse", async () => {
  expect(await createSocialApproval(input)).toEqual({ row, created: false });
  await expect(
    createSocialApproval({ ...input, caption: "changed" }),
  ).rejects.toThrow("REQUEST_ID_CONFLICT");
  expect(mocks.create).not.toHaveBeenCalled();
});
it("new revision supersedes old decisions and starts unapproved", async () => {
  mocks.findUnique.mockResolvedValue(null);
  mocks.findFirst.mockResolvedValue(row);
  await createSocialApproval({ ...input, requestId: "new-request-identifier" });
  expect(mocks.updateMany).toHaveBeenCalledWith({
    where: { reviewKey: input.reviewKey },
    data: { status: "SUPERSEDED" },
  });
  expect(mocks.create).toHaveBeenCalledWith({
    data: { ...input, requestId: "new-request-identifier", revision: 2 },
  });
});
it("does not reactivate an already superseded revision after delivery", async () => {
  await recordSocialMessage(row.id, row.messageTs);
  expect(mocks.updateMany).toHaveBeenCalledWith({
    where: { id: row.id, status: "POSTING" },
    data: { messageTs: row.messageTs, status: "PENDING" },
  });
});
