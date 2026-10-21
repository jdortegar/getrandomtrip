// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  find: vi.fn(),
  update: vi.fn(),
  approvalCount: vi.fn(),
  createMany: vi.fn(),
  lock: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (work: (tx: unknown) => unknown) =>
      work({
        socialSource: { findUnique: m.find, update: m.update },
        socialApproval: { count: m.approvalCount },
      }),
    socialSource: { createMany: m.createMany },
  },
}));
vi.mock("../socialApprovals", () => ({ lockSocialApproval: m.lock }));
import { markSourcePosted, markSyncedThrough } from "../socialSources";

const input = { sourceId: "src", messageTs: "9.9" };
beforeEach(() => {
  vi.resetAllMocks();
  m.find.mockResolvedValue({
    id: "src",
    messageTs: "9.9",
    status: "UNSUPPORTED",
  });
  m.approvalCount.mockResolvedValue(0);
  m.update.mockResolvedValue({ id: "src", status: "SYNCED" });
});

it("marks a waiting post as already on English under the source lock", async () => {
  expect(await markSourcePosted(input)).toEqual({
    id: "src",
    status: "SYNCED",
  });
  expect(m.lock).toHaveBeenCalledWith(expect.anything(), "source:src");
  expect(m.update).toHaveBeenCalledWith({
    where: { id: "src" },
    data: { status: "SYNCED" },
  });
});
it("never marks a post the app is publishing or has published", async () => {
  m.find.mockResolvedValue({
    id: "src",
    messageTs: "9.9",
    status: "TRANSLATED",
  });
  m.approvalCount.mockResolvedValue(1);
  expect(await markSourcePosted(input)).toBeNull();
  m.approvalCount.mockResolvedValue(0);
  m.find.mockResolvedValue({
    id: "src",
    messageTs: "9.9",
    status: "PUBLISHED",
  });
  expect(await markSourcePosted(input)).toBeNull();
  m.find.mockResolvedValue({
    id: "src",
    messageTs: "other",
    status: "ANNOUNCED",
  });
  expect(await markSourcePosted(input)).toBeNull();
  expect(m.update).not.toHaveBeenCalled();
});
it("records the starting point as synced without touching existing rows", async () => {
  m.createMany.mockResolvedValue({ count: 1 });
  await markSyncedThrough([
    {
      id: "ig-1",
      caption: "c",
      mediaType: "IMAGE",
      permalink: "https://www.instagram.com/p/A/",
      postedAt: new Date(0),
      previewUrl: null,
    },
  ]);
  expect(m.createMany).toHaveBeenCalledWith({
    data: [expect.objectContaining({ igMediaId: "ig-1", status: "SYNCED" })],
    skipDuplicates: true,
  });
});
