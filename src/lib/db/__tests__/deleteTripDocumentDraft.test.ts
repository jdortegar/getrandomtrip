// @vitest-environment node
import type { Prisma, PrismaClient } from "@prisma/client";
import { expect, it } from "vitest";
import { deleteTripDocumentDraft } from "../deleteTripDocumentDraft";
const scope = { ownerId: "buyer", tripRequestId: "trip", draftId: "draft" };
function database(fail = false) {
  let exists = true;
  const jobs = [
    { id: "a", purpose: "preview", disposition: "retained" },
    { id: "b", purpose: "publication", disposition: "pending" },
    { id: "c", purpose: "publication", disposition: "retained" },
  ];
  const events: string[] = [];
  let revision = 2;
  const db = {
    async $transaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) {
      const pending = structuredClone(jobs);
      let deleted = false;
      const tx = {
        async $queryRaw(query: Prisma.Sql) {
          const table = query.text.match(/FROM "([^"]+)"/)![1];
          events.push(table);
          if (table === "users") return [{ id: "buyer" }];
          if (table === "trip_requests")
            return [{ id: "trip", userId: "buyer" }];
          if (table === "trip_document_drafts")
            return exists ? [{ id: "draft", tripRequestId: "trip" }] : [];
          return pending;
        },
        tripDocumentDraft: {
          async findUnique() {
            return {
              id: "draft",
              tripRequestId: "trip",
              revision,
              documentId: "published",
            };
          },
          async delete() {
            deleted = true;
            events.push("delete-draft");
          },
        },
        tripDocumentCleanupJob: {
          async updateMany({
            where,
            data,
          }: {
            where: { id: { in: string[] } };
            data: Record<string, unknown>;
          }) {
            for (const row of pending)
              if (where.id.in.includes(row.id)) Object.assign(row, data);
            return { count: where.id.in.length };
          },
        },
      } as unknown as Prisma.TransactionClient;
      const result = await work(tx);
      if (fail) throw new Error("rollback");
      jobs.splice(0, jobs.length, ...pending);
      if (deleted) exists = false;
      return result;
    },
  } as Pick<PrismaClient, "$transaction">;
  return {
    db,
    jobs,
    events,
    get exists() {
      return exists;
    },
    changeRevision() {
      revision = 3;
    },
  };
}
it("deletes only draft and tombstones previews/pendingpublications preserving retainedattachments", async () => {
  const fake = database();
  await deleteTripDocumentDraft(fake.db, scope, 2);
  expect(fake.exists).toBe(false);
  expect(fake.jobs.map((row) => row.disposition)).toEqual([
    "delete",
    "delete",
    "retained",
  ]);
  expect(fake.events).toEqual([
    "users",
    "trip_requests",
    "trip_document_drafts",
    "trip_document_cleanup_jobs",
    "delete-draft",
  ]);
});
it("rejects stale revision before cancellation", async () => {
  const fake = database();
  fake.changeRevision();
  await expect(deleteTripDocumentDraft(fake.db, scope, 2)).rejects.toThrow(
    "DOCUMENT_DRAFT_REVISION_CONFLICT",
  );
  expect(fake.exists).toBe(true);
  expect(fake.jobs[0].disposition).toBe("retained");
});
it("rolls back tombstones together with draft deletion", async () => {
  const fake = database(true);
  await expect(deleteTripDocumentDraft(fake.db, scope, 2)).rejects.toThrow(
    "rollback",
  );
  expect(fake.exists).toBe(true);
  expect(fake.jobs.map((row) => row.disposition)).toEqual([
    "retained",
    "pending",
    "retained",
  ]);
});
it("requires positive safe revision before transaction", async () => {
  const fake = database();
  await expect(deleteTripDocumentDraft(fake.db, scope, 0)).rejects.toThrow(
    "INVALID_DOCUMENT_REVISION",
  );
  expect(fake.events).toEqual([]);
});
