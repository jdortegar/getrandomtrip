// @vitest-environment node
import type { Prisma, PrismaClient } from "@prisma/client";
import { expect, it } from "vitest";
import { createTripDocumentSnapshot } from "@/lib/trip-documents/snapshots";
import { updateTripDocumentDraft } from "../updateTripDocumentDraft";
const document = createTripDocumentSnapshot("hotel-voucher", {
  user: { name: "Saved buyer" },
});
const scope = { ownerId: "buyer", tripRequestId: "trip", draftId: "draft" };
function database() {
  let row = {
    ...document,
    id: "draft",
    tripRequestId: "trip",
    revision: 1,
    previewId: "preview",
    previewKey: "private",
    previewRevision: 1,
    previewHash: "hash",
    previewSize: 123,
    publishedRevision: 1,
    publishedPreviewId: "published",
    documentId: "attached",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const events: string[] = [];
  let owner = "buyer";
  let fail = false;
  let queue = Promise.resolve();
  const db = {
    $transaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) {
      const run = queue.then(async () => {
        const pending = structuredClone(row);
        const tx = {
          async $queryRaw(query: Prisma.Sql) {
            const table = query.text.match(/FROM "([^"]+)"/)![1];
            events.push(table);
            return table === "users"
              ? [{ id: "buyer" }]
              : table === "trip_requests"
                ? [{ id: "trip", userId: owner }]
                : [{ id: "draft", tripRequestId: pending.tripRequestId }];
          },
          tripDocumentDraft: {
            async findUnique() {
              return pending;
            },
            async update({ data }: { data: Record<string, unknown> }) {
              events.push("update");
              Object.assign(pending, data);
              return pending;
            },
          },
        } as unknown as Prisma.TransactionClient;
        const result = await work(tx);
        if (fail) throw new Error("commit failed");
        row = pending;
        return result;
      });
      queue = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
  } as Pick<PrismaClient, "$transaction">;
  return {
    db,
    events,
    get row() {
      return row;
    },
    changeOwner() {
      owner = "other";
    },
    failCommit() {
      fail = true;
    },
  };
}
it("saves incomplete content under owner/trip/draft locks and invalidates only preview", async () => {
  const fake = database();
  const result = await updateTripDocumentDraft(fake.db, scope, {
    revision: 1,
    document: { ...document, label: " Edited " },
  });
  expect(result).toMatchObject({
    ok: true,
    value: {
      revision: 2,
      previewId: null,
      documentId: "attached",
      publishedRevision: 1,
      document: { label: "Edited", data: { holder: "Saved buyer" } },
    },
  });
  expect(fake.events).toEqual([
    "users",
    "trip_requests",
    "trip_document_drafts",
    "update",
  ]);
  expect(fake.row).toMatchObject({
    previewKey: null,
    previewHash: null,
    previewSize: null,
    previewRevision: null,
    publishedPreviewId: "published",
  });
});
it("allows only one of two competing revision saves", async () => {
  const fake = database();
  const results = await Promise.all(
    ["First", "Second"].map((label) =>
      updateTripDocumentDraft(fake.db, scope, {
        revision: 1,
        document: { ...document, label },
      }),
    ),
  );
  expect(results.map((result) => result.ok)).toEqual([true, false]);
  expect(results[1]).toEqual({ ok: false, error: "revision_conflict" });
  expect(fake.row.revision).toBe(2);
});
it("rejects changing template and rolls back commit failures", async () => {
  const fake = database();
  expect(
    await updateTripDocumentDraft(fake.db, scope, {
      revision: 1,
      document: createTripDocumentSnapshot("xsed-roadmap", {}),
    }),
  ).toEqual({ ok: false, error: "immutable_template" });
  fake.failCommit();
  await expect(
    updateTripDocumentDraft(fake.db, scope, { revision: 1, document }),
  ).rejects.toThrow("commit failed");
  expect(fake.row.revision).toBe(1);
});
it("rejects changed ownership and malformed input without mutation", async () => {
  const fake = database();
  expect(
    (await updateTripDocumentDraft(fake.db, scope, { revision: 0, document }))
      .ok,
  ).toBe(false);
  expect(fake.events).toEqual([]);
  fake.changeOwner();
  await expect(
    updateTripDocumentDraft(fake.db, scope, { revision: 1, document }),
  ).rejects.toThrow("DOCUMENT_LOCK_SCOPE_MISMATCH");
  expect(fake.row.revision).toBe(1);
});
