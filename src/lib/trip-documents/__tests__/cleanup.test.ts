// @vitest-environment node
import { describe, expect, it } from "vitest";
import { sweepExactDocumentKey as sweep } from "../cleanup";
import { planDocumentCleanup } from "../cleanupTargets";
import type { TripDocumentCleanupExecutionJob as Job } from "@/lib/types/TripDocumentCleanupExecution";

const uuid = "00000000-0000-4000-8000-000000000001";
const key = `generated/trip/drafts/draft/${uuid}`;
const job: Job = {
  id: uuid,
  ownerId: "buyer",
  tripRequestId: "trip",
  draftId: "draft",
  documentId: null,
  previewId: uuid,
  revision: 1,
  purpose: "preview",
  disposition: "delete",
  targets: { keys: [key], prefixes: [] },
};
function runtime(initial: Job = job) {
  const stored = structuredClone(initial);
  const blobs = new Set([key]);
  const deleted: string[] = [];
  const controls = { missing: false, failure: false };
  return {
    stored,
    blobs,
    deleted,
    controls,
    findJob: async () => (controls.missing ? null : stored),
    deleteKey: async (target: string) => {
      if (controls.failure) throw new Error("storage unavailable");
      deleted.push(target);
      blobs.delete(target);
    },
  };
}
describe("sweepExactDocumentKey", () => {
  it("deletes only the exact preview key while retaining its durable tombstone", async () => {
    const fake = runtime();
    fake.blobs.add("other/key");
    expect(await sweep(uuid, fake)).toBe("swept");
    expect(fake.deleted).toEqual([key]);
    expect([...fake.blobs]).toEqual(["other/key"]);
    expect(fake.stored).toEqual(job);
  });
  it.each(["pending", "retained"])(
    "never deletes a %s candidate",
    async (disposition) => {
      const fake = runtime({ ...job, disposition });
      expect(await sweep(uuid, fake)).toBe("skipped");
      expect(fake.deleted).toEqual([]);
      expect(fake.blobs.has(key)).toBe(true);
    },
  );
  it("skips missing jobs without consulting a parent", async () => {
    const fake = runtime();
    fake.controls.missing = true;
    expect(await sweep(uuid, fake)).toBe("skipped");
    expect(fake.deleted).toEqual([]);
  });
  it("sweeps late PUTs after absence and after a successful prior deletion", async () => {
    const fake = runtime();
    fake.blobs.clear();
    await sweep(uuid, fake);
    for (let retry = 0; retry < 2; retry++) {
      fake.blobs.add(key);
      expect(await sweep(uuid, fake)).toBe("swept");
      expect(fake.blobs.has(key)).toBe(false);
      expect(fake.stored).toEqual(job);
    }
    expect(fake.deleted).toEqual([key, key, key]);
  });
  it("propagates storage failure without retiring the job and can retry", async () => {
    const fake = runtime();
    fake.controls.failure = true;
    await expect(sweep(uuid, fake)).rejects.toThrow("storage unavailable");
    expect(fake.stored).toEqual(job);
    expect(fake.blobs.has(key)).toBe(true);
    fake.controls.failure = false;
    expect(await sweep(uuid, fake)).toBe("swept");
    expect(fake.blobs.has(key)).toBe(false);
  });
  it("sweeps publication and planned legacy keys independently", async () => {
    const publication = {
      ...job,
      purpose: "publication",
      documentId: "document",
      previewId: "previous",
    };
    const publicationKey = `generated/trip/documents/document/${uuid}`;
    publication.targets = { keys: [publicationKey], prefixes: [] };
    const legacyKey = `trip/${uuid}`;
    const legacy = planDocumentCleanup(
      { kind: "trip", ownerId: "buyer", tripRequestId: "trip" },
      {
        trips: [{ id: "trip", userId: "buyer" }],
        drafts: [],
        documents: [
          { id: "document", tripRequestId: "trip", storageKey: legacyKey },
        ],
      },
    ).find((item) => item.purpose === "legacy-key")!;
    for (const [receipt, target] of [
      [publication, publicationKey],
      [legacy, legacyKey],
    ] as const) {
      const fake = runtime(receipt);
      fake.blobs.add(target);
      expect(await sweep(receipt.id, fake)).toBe("swept");
      expect(fake.deleted).toEqual([target]);
      expect(fake.blobs.has(target)).toBe(false);
    }
  });
  it.each([
    { id: "other" },
    { ownerId: "buyer?x" },
    { tripRequestId: "trip%2foutside" },
    { draftId: "draft#x" },
    { previewId: "other" },
    { documentId: "unexpected" },
    { revision: 0 },
    { purpose: "scope-prefix" },
    { disposition: "unknown" },
    { targets: { keys: ["other/key"], prefixes: [] } },
    { targets: { keys: [key, "other/key"], prefixes: [] } },
    { targets: { keys: [key], prefixes: ["generated/trip/"] } },
    { targets: null },
  ] as Partial<Job>[])(
    "rejects unsafe or mismatched job %j before deleting",
    async (patch) => {
      const fake = runtime({ ...job, ...patch });
      await expect(sweep(uuid, fake)).rejects.toThrow(
        "INVALID_DOCUMENT_CLEANUP_JOB",
      );
      expect(fake.deleted).toEqual([]);
      expect(fake.blobs.has(key)).toBe(true);
    },
  );
  it.each([538, 539])(
    "enforces complete UTF-8 publication key limit at %s suffix bytes",
    async (bytes) => {
      const documentId = "é".repeat(269) + (bytes === 539 ? "a" : "");
      const target = `generated/trip/documents/${documentId}/${uuid}`;
      const fake = runtime({
        ...job,
        purpose: "publication",
        documentId,
        previewId: "prior",
        targets: { keys: [target], prefixes: [] },
      });
      fake.blobs.add(target);
      if (bytes === 538) {
        expect(Buffer.byteLength(target)).toBe(600);
        expect(await sweep(uuid, fake)).toBe("swept");
        expect(fake.deleted).toEqual([target]);
      } else {
        await expect(sweep(uuid, fake)).rejects.toThrow(
          "INVALID_DOCUMENT_CLEANUP_JOB",
        );
        expect(fake.deleted).toEqual([]);
      }
    },
  );
  it("rejects a legacy key whose persisted identity does not match its deterministic job", async () => {
    const legacy = planDocumentCleanup(
      { kind: "trip", ownerId: "buyer", tripRequestId: "trip" },
      {
        trips: [{ id: "trip", userId: "buyer" }],
        drafts: [],
        documents: [
          { id: "document", tripRequestId: "trip", storageKey: `trip/${uuid}` },
        ],
      },
    ).find((item) => item.purpose === "legacy-key")!;
    for (const patch of [
      { ownerId: "other" },
      { documentId: "other" },
      { targets: { keys: [`other/${uuid}`], prefixes: [] } },
    ]) {
      const fake = runtime({ ...legacy, ...patch });
      await expect(sweep(legacy.id, fake)).rejects.toThrow(
        "INVALID_DOCUMENT_CLEANUP_JOB",
      );
      expect(fake.deleted).toEqual([]);
    }
  });
  it("propagates receipt read failure without deleting bytes", async () => {
    const fake = runtime();
    fake.findJob = async () => {
      throw new Error("database unavailable");
    };
    await expect(sweep(uuid, fake)).rejects.toThrow("database unavailable");
    expect(fake.deleted).toEqual([]);
    expect(fake.blobs.has(key)).toBe(true);
  });
});
