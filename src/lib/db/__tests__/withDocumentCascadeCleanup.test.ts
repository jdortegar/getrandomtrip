// @vitest-environment node
import type { Prisma, PrismaClient } from "@prisma/client";
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("../tripDocumentCleanupRegistration", () => ({
  registerDocumentCleanup: vi.fn(),
}));
import { registerDocumentCleanup } from "../tripDocumentCleanupRegistration";
import { withDocumentCascadeCleanup } from "../withDocumentCascadeCleanup";
const query = vi.fn();
const update = vi.fn();
const cascade = vi.fn();
const tx = { $queryRaw: query, tripDocumentCleanupJob: { updateMany: update } };
const transaction = vi.fn(async (work: (client: unknown) => Promise<unknown>) =>
  work(tx),
);
const db = { $transaction: transaction } as unknown as Pick<
  PrismaClient,
  "$transaction"
>;
const trips = [
  { id: "trip-a", userId: "buyer" },
  { id: "trip-b", userId: "buyer" },
];
const drafts = [{ id: "draft", tripRequestId: "trip-a" }];
const documents = [
  {
    id: "doc",
    tripRequestId: "trip-b",
    storageKey: "trip-b/00000000-0000-4000-8000-000000000001",
  },
];
beforeEach(() => {
  vi.clearAllMocks();
  query
    .mockReset()
    .mockResolvedValueOnce([{ id: "buyer" }])
    .mockResolvedValueOnce(trips)
    .mockResolvedValueOnce(drafts)
    .mockResolvedValueOnce(documents)
    .mockResolvedValueOnce([
      { id: "pending", purpose: "publication", disposition: "pending" },
      { id: "retained", purpose: "publication", disposition: "retained" },
      { id: "preview", purpose: "preview", disposition: "retained" },
    ]);
  update.mockResolvedValue({ count: 3 });
  cascade.mockResolvedValue("deleted");
  vi.mocked(registerDocumentCleanup).mockResolvedValue([]);
});
it("locks all buyer-owned rows in order and retains exact cleanup before account cascade", async () => {
  await expect(
    withDocumentCascadeCleanup(
      db,
      { kind: "account", ownerId: "buyer" },
      cascade,
    ),
  ).resolves.toBe("deleted");
  const sql = query.mock.calls.map(([value]) => value as Prisma.Sql);
  expect(sql.map((value) => value.text.match(/FROM "([^"]+)"/)?.[1])).toEqual([
    "users",
    "trip_requests",
    "trip_document_drafts",
    "trip_documents",
    "trip_document_cleanup_jobs",
  ]);
  sql.forEach((value) =>
    expect(value.text).toContain('ORDER BY "id" FOR UPDATE'),
  );
  expect(sql[1].text).toContain('"userId"=');
  expect(sql[1].values).toEqual(["buyer"]);
  expect(sql[2].values).toEqual(["trip-a", "trip-b"]);
  expect(sql[3].values).toEqual(["trip-a", "trip-b"]);
  expect(sql[4].values).toEqual(["buyer"]);
  expect(update).toHaveBeenCalledWith({
    where: {
      id: { in: ["pending", "retained", "preview"] },
      disposition: { not: "delete" },
    },
    data: { disposition: "delete", nextAttemptAt: expect.any(Date) },
  });
  expect(registerDocumentCleanup).toHaveBeenCalledWith(
    tx,
    { kind: "account", ownerId: "buyer" },
    { trips, drafts, documents },
    expect.any(Function),
    { exactKeysOnly: true },
  );
  expect(cascade).toHaveBeenCalledWith(tx);
  expect(update.mock.invocationCallOrder[0]).toBeLessThan(
    vi.mocked(registerDocumentCleanup).mock.invocationCallOrder[0],
  );
  expect(
    vi.mocked(registerDocumentCleanup).mock.invocationCallOrder[0],
  ).toBeLessThan(cascade.mock.invocationCallOrder[0]);
});
it("restricts a trip cascade to both the buyer and requested trip", async () => {
  query
    .mockReset()
    .mockResolvedValueOnce([{ id: "buyer" }])
    .mockResolvedValueOnce([trips[0]])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([]);
  await withDocumentCascadeCleanup(
    db,
    { kind: "trip", ownerId: "buyer", tripRequestId: "trip-a" },
    cascade,
  );
  expect(query.mock.calls[1][0].values).toEqual(["buyer", "trip-a"]);
  expect(query.mock.calls[4][0].values).toEqual(["buyer", "trip-a"]);
  expect(update).not.toHaveBeenCalled();
  expect(cascade).toHaveBeenCalledOnce();
});
it("cancels orphaned owner receipts even for an account with no live trips", async () => {
  query
    .mockReset()
    .mockResolvedValueOnce([{ id: "buyer" }])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([
      { id: "orphan", purpose: "preview", disposition: "pending" },
    ]);
  await withDocumentCascadeCleanup(
    db,
    { kind: "account", ownerId: "buyer" },
    cascade,
  );
  expect(query).toHaveBeenCalledTimes(3);
  expect(update.mock.calls[0][0].where.id.in).toEqual(["orphan"]);
  expect(registerDocumentCleanup).toHaveBeenCalledWith(
    tx,
    { kind: "account", ownerId: "buyer" },
    { trips: [], drafts: [], documents: [] },
    expect.any(Function),
    { exactKeysOnly: true },
  );
});
it("rejects a missing or foreign trip before any cascade or outbox mutation", async () => {
  query
    .mockReset()
    .mockResolvedValueOnce([{ id: "buyer" }])
    .mockResolvedValueOnce([]);
  await expect(
    withDocumentCascadeCleanup(
      db,
      { kind: "trip", ownerId: "buyer", tripRequestId: "foreign" },
      cascade,
    ),
  ).rejects.toThrow("DOCUMENT_LOCK_SCOPE_MISMATCH");
  expect(update).not.toHaveBeenCalled();
  expect(cascade).not.toHaveBeenCalled();
});
it("propagates registration failures to the enclosing transaction before cascade", async () => {
  vi.mocked(registerDocumentCleanup).mockRejectedValue(
    new Error("outbox unavailable"),
  );
  await expect(
    withDocumentCascadeCleanup(
      db,
      { kind: "account", ownerId: "buyer" },
      cascade,
    ),
  ).rejects.toThrow("outbox unavailable");
  expect(cascade).not.toHaveBeenCalled();
});
it("propagates cascade failures rather than committing cleanup independently", async () => {
  cascade.mockRejectedValue(new Error("cascade failed"));
  await expect(
    withDocumentCascadeCleanup(
      db,
      { kind: "account", ownerId: "buyer" },
      cascade,
    ),
  ).rejects.toThrow("cascade failed");
  expect(transaction).toHaveBeenCalledOnce();
});
