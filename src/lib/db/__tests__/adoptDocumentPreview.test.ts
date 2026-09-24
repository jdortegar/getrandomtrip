// @vitest-environment node
import type { Prisma, PrismaClient } from "@prisma/client";
import { expect, it } from "vitest";
import { adoptDocumentPreview } from "../adoptDocumentPreview";
const receipt = {
  id: "receipt",
  ownerId: "buyer",
  tripRequestId: "trip",
  draftId: "draft",
  documentId: null,
  previewId: "preview",
  revision: 1,
  purpose: "preview" as const,
  key: "generated/trip/drafts/draft/preview",
  expiresAt: "2030-01-01T00:00:00.000Z",
};
const bytes = { size: 100, hash: "a".repeat(64) };
function database(
  options: {
    revision?: number;
    deleted?: boolean;
    ambiguous?: boolean;
    rollback?: boolean;
    disposition?: string;
  } = {},
) {
  let draft: Record<string, unknown> = {
    id: "draft",
    tripRequestId: "trip",
    revision: options.revision ?? 1,
  };
  let job: Record<string, unknown> = {
    ...receipt,
    expiresAt: new Date(receipt.expiresAt),
    targets: { keys: [receipt.key], prefixes: [] },
    disposition: options.disposition ?? "pending",
  };
  let first = true;
  const events: string[] = [];
  const db = {
    async $transaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) {
      const pendingDraft = { ...draft };
      const pendingJob = { ...job };
      const tx = {
        async $queryRaw(query: Prisma.Sql) {
          const table = query.text.match(/FROM "([^"]+)"/)![1];
          events.push(table);
          if (table === "users") return [{ id: "buyer" }];
          if (table === "trip_requests")
            return [{ id: "trip", userId: "buyer" }];
          if (table === "trip_document_drafts")
            return options.deleted ? [] : [pendingDraft];
          return [pendingJob];
        },
        tripDocumentDraft: {
          async findUnique() {
            return pendingDraft;
          },
          async update({ data }: { data: Record<string, unknown> }) {
            Object.assign(pendingDraft, data);
            return pendingDraft;
          },
        },
        tripDocumentCleanupJob: {
          async updateMany() {
            pendingJob.disposition = "retained";
            return { count: 1 };
          },
        },
      } as unknown as Prisma.TransactionClient;
      const result = await work(tx);
      if (options.rollback) throw new Error("rollback");
      draft = pendingDraft;
      job = pendingJob;
      if (options.ambiguous && first) {
        first = false;
        throw new Error("commit response lost");
      }
      return result;
    },
  } as Pick<PrismaClient, "$transaction">;
  return {
    db,
    events,
    get draft() {
      return draft;
    },
    get job() {
      return job;
    },
  };
}
it("atomically retains receipt and stores private preview identity without revision increment", async () => {
  const fake = database();
  expect(await adoptDocumentPreview(fake.db, receipt, bytes)).toBe("adopted");
  expect(fake.job.disposition).toBe("retained");
  expect(fake.draft).toMatchObject({
    revision: 1,
    previewId: "preview",
    previewKey: receipt.key,
    previewRevision: 1,
    previewHash: bytes.hash,
    previewSize: 100,
  });
  expect(fake.events.slice(0, 3)).toEqual([
    "users",
    "trip_requests",
    "trip_document_drafts",
  ]);
});
it("rejects stale revisions leaving candidate pending for cleanup", async () => {
  const fake = database({ revision: 2 });
  await expect(adoptDocumentPreview(fake.db, receipt, bytes)).rejects.toThrow(
    "DOCUMENT_PREVIEW_REVISION_CONFLICT",
  );
  expect(fake.job.disposition).toBe("pending");
  expect(fake.draft.previewKey).toBeUndefined();
});
it("reconciles ambiguous commit using durable receipt rather than preview pointer", async () => {
  const fake = database({ ambiguous: true });
  expect(await adoptDocumentPreview(fake.db, receipt, bytes)).toBe("retained");
  expect(fake.job.disposition).toBe("retained");
  const superseded = database({ revision: 2, disposition: "retained" });
  expect(await adoptDocumentPreview(superseded.db, receipt, bytes)).toBe(
    "retained",
  );
  expect(superseded.draft.previewKey).toBeUndefined();
});
it("does not infer success after rollback or deleted parent", async () => {
  const rollback = database({ rollback: true });
  await expect(
    adoptDocumentPreview(rollback.db, receipt, bytes),
  ).rejects.toThrow("rollback");
  expect(rollback.job.disposition).toBe("pending");
  await expect(
    adoptDocumentPreview(database({ deleted: true }).db, receipt, bytes),
  ).rejects.toThrow("DOCUMENT_LOCK_SCOPE_MISMATCH");
});
it.each([
  { size: 0, hash: bytes.hash },
  { size: 4 * 1024 * 1024 + 1, hash: bytes.hash },
  { size: 100, hash: "bad" },
])("rejects invalid bytes metadata before transactions", async (metadata) => {
  const fake = database();
  await expect(
    adoptDocumentPreview(fake.db, receipt, metadata),
  ).rejects.toThrow("INVALID_DOCUMENT_PREVIEW");
  expect(fake.events).toEqual([]);
});
