// @vitest-environment node
import type { PrismaClient } from "@prisma/client";
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/storage/tripDocumentStore", () => ({
  getTripDocumentStore: vi.fn(),
}));
import { getTripDocumentStore } from "@/lib/storage/tripDocumentStore";
import { runDocumentCleanupBatch } from "../runDocumentCleanupBatch";
const now = 1_000_000;
const id = "00000000-0000-4000-8000-000000000001";
const key = `generated/trip/drafts/draft/${id}`;
const job = {
  id,
  ownerId: "buyer",
  tripRequestId: "trip",
  draftId: "draft",
  documentId: null,
  previewId: id,
  revision: 1,
  purpose: "preview",
  disposition: "delete",
  targets: { keys: [key], prefixes: [] },
  attempts: 0,
};
const query = vi.fn();
const update = vi.fn();
const find = vi.fn();
const remove = vi.fn();
const tx = { $queryRaw: query, tripDocumentCleanupJob: { updateMany: update } };
const transaction = vi.fn(async (work: (client: unknown) => Promise<unknown>) =>
  work(tx),
);
const db = {
  $transaction: transaction,
  tripDocumentCleanupJob: { updateMany: update, findUnique: find },
} as unknown as Pick<PrismaClient, "$transaction" | "tripDocumentCleanupJob">;
beforeEach(() => {
  vi.resetAllMocks();
  transaction.mockImplementation(async (work) => work(tx));
  query.mockResolvedValue([job]);
  update.mockResolvedValue({ count: 1 });
  find.mockResolvedValue(job);
  remove.mockResolvedValue(undefined);
  vi.mocked(getTripDocumentStore).mockReturnValue({ delete: remove } as never);
});
it("claims a bounded fair skip-locked batch then deletes raw exact keys outside transaction", async () => {
  let inTransaction = false;
  transaction.mockImplementation(async (work) => {
    inTransaction = true;
    try {
      return await work(tx);
    } finally {
      inTransaction = false;
    }
  });
  remove.mockImplementation(async (raw) => {
    expect(inTransaction).toBe(false);
    expect(raw).toBe(key);
  });
  expect(await runDocumentCleanupBatch(db, () => now)).toEqual({
    claimed: 1,
    swept: 1,
    failed: 0,
  });
  const sql = query.mock.calls[0][0];
  expect(sql.text).toContain('ORDER BY "nextAttemptAt", "id"');
  expect(sql.text).toContain("LIMIT 20 FOR UPDATE SKIP LOCKED");
  expect(sql.text).toContain("\"disposition\"='delete'");
  expect(sql.text).toContain('"expiresAt"<=');
  expect(sql.values).toEqual([new Date(now), new Date(now)]);
  expect(update.mock.calls[0][0]).toEqual({
    where: { id },
    data: { nextAttemptAt: new Date(now + 300_000) },
  });
  expect(update.mock.calls[1][0]).toEqual({
    where: {
      id,
      nextAttemptAt: new Date(now + 300_000),
      disposition: "delete",
    },
    data: {
      nextAttemptAt: new Date(now + 3_600_000),
      attempts: 0,
      lastError: null,
    },
  });
});
it("keeps absent keys scheduled and removes a late PUT on a later sweep", async () => {
  let exists = false;
  remove.mockImplementation(async () => {
    exists = false;
  });
  await runDocumentCleanupBatch(db, () => now);
  exists = true;
  await runDocumentCleanupBatch(db, () => now + 3_600_000);
  expect(exists).toBe(false);
  expect(remove).toHaveBeenCalledTimes(2);
  expect(update.mock.calls.at(-1)![0].data.nextAttemptAt.getTime()).toBe(
    now + 7_200_000,
  );
});
it("expires pending candidates conditionally before claiming without needing parents", async () => {
  query.mockResolvedValue([{ ...job, disposition: "pending" }]);
  await runDocumentCleanupBatch(db, () => now);
  expect(update.mock.calls[0][0]).toEqual({
    where: { id, disposition: "pending", expiresAt: { lte: new Date(now) } },
    data: { disposition: "delete", nextAttemptAt: new Date(now) },
  });
  expect(remove).toHaveBeenCalledWith(key);
});
it("never deletes a retained receipt if conditional expiry loses", async () => {
  query.mockResolvedValue([{ ...job, disposition: "pending" }]);
  update.mockResolvedValueOnce({ count: 0 });
  expect(await runDocumentCleanupBatch(db, () => now)).toEqual({
    claimed: 0,
    swept: 0,
    failed: 0,
  });
  expect(remove).not.toHaveBeenCalled();
});
it("backs off failing jobs with sanitized errors and continues the batch", async () => {
  const next = {
    ...job,
    id: "00000000-0000-4000-8000-000000000002",
    previewId: "00000000-0000-4000-8000-000000000002",
  };
  next.targets = {
    keys: [`generated/trip/drafts/draft/${next.id}`],
    prefixes: [],
  };
  query.mockResolvedValue([{ ...job, attempts: 30 }, next]);
  find.mockResolvedValueOnce(job).mockResolvedValueOnce(next);
  remove.mockRejectedValueOnce(new Error("secret key private provider URL"));
  expect(await runDocumentCleanupBatch(db, () => now)).toEqual({
    claimed: 2,
    swept: 1,
    failed: 1,
  });
  expect(update.mock.calls[2][0].data).toEqual({
    attempts: 30,
    nextAttemptAt: new Date(now + 86_400_000),
    lastError: "exact_key_cleanup_failed",
  });
  expect(remove).toHaveBeenCalledTimes(2);
});
it("advances invalid targets without deleting arbitrary storage", async () => {
  find.mockResolvedValue({
    ...job,
    targets: { keys: ["other/private"], prefixes: [] },
  });
  expect((await runDocumentCleanupBatch(db, () => now)).failed).toBe(1);
  expect(remove).not.toHaveBeenCalled();
  expect(
    update.mock.calls.at(-1)![0].data.nextAttemptAt.getTime(),
  ).toBeGreaterThan(now);
});
it("does not overwrite a newer worker lease on completion", async () => {
  update
    .mockResolvedValueOnce({ count: 1 })
    .mockResolvedValueOnce({ count: 0 });
  await runDocumentCleanupBatch(db, () => now);
  expect(update.mock.calls.at(-1)![0].where).toEqual({
    id,
    disposition: "delete",
    nextAttemptAt: new Date(now + 300_000),
  });
});
it("does no storage work for an empty due batch", async () => {
  query.mockResolvedValue([]);
  expect(await runDocumentCleanupBatch(db, () => now)).toEqual({
    claimed: 0,
    swept: 0,
    failed: 0,
  });
  expect(getTripDocumentStore).not.toHaveBeenCalled();
});
it("advances a failed first page so later due jobs run on the next batch", async () => {
  const rows = Array.from({ length: 21 }, (_, index) => {
    const candidateId = `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
    return {
      ...job,
      id: candidateId,
      previewId: candidateId,
      targets: {
        keys: [`generated/trip/drafts/draft/${candidateId}`],
        prefixes: [],
      },
      nextAttemptAt: new Date(now - 1),
    };
  });
  query.mockImplementation(async () =>
    rows
      .filter((row) => row.nextAttemptAt.getTime() <= now)
      .sort(
        (a, b) =>
          a.nextAttemptAt.getTime() - b.nextAttemptAt.getTime() ||
          a.id.localeCompare(b.id),
      )
      .slice(0, 20)
      .map((row) => ({ ...row })),
  );
  find.mockImplementation(async ({ where }) =>
    rows.find((row) => row.id === where.id),
  );
  update.mockImplementation(async ({ where, data }) => {
    const row = rows.find((item) => item.id === where.id)!;
    if (
      where.nextAttemptAt &&
      row.nextAttemptAt.getTime() !== where.nextAttemptAt.getTime()
    )
      return { count: 0 };
    Object.assign(row, data);
    return { count: 1 };
  });
  remove.mockRejectedValue(new Error("provider unavailable"));
  expect((await runDocumentCleanupBatch(db, () => now)).claimed).toBe(20);
  expect((await runDocumentCleanupBatch(db, () => now)).claimed).toBe(1);
  expect(remove).toHaveBeenCalledWith(rows[20].targets.keys[0]);
  expect(rows.every((row) => row.nextAttemptAt.getTime() > now)).toBe(true);
});
