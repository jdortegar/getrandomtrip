// @vitest-environment node
import type { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import type { TripDocumentCandidateReceipt } from "@/lib/types/TripDocumentCandidate";
import {
  retainDocumentCandidate as retain,
  reconcileDocumentCandidate as reconcile,
  expireDocumentCandidate as expire,
} from "../tripDocumentCandidateLifecycle";

const now = Date.parse("2026-09-23T12:00:00Z");
const receipt: TripDocumentCandidateReceipt = {
  id: "candidate",
  ownerId: "buyer",
  tripRequestId: "trip",
  draftId: "draft",
  documentId: "document",
  previewId: "preview",
  revision: 2,
  purpose: "publication",
  key: "generated/trip/documents/document/candidate",
  expiresAt: new Date(now + 60000).toISOString(),
};
function database(disposition = "pending", expected = receipt) {
  const { key, expiresAt, ...identity } = expected;
  const initial = {
    ...identity,
    disposition,
    expiresAt: new Date(expiresAt),
    targets: { keys: [key], prefixes: [] },
    nextAttemptAt: new Date(now - 1000),
  };
  const state = { row: initial as typeof initial | undefined, pointer: "old" };
  const queries: Prisma.Sql[] = [];
  const controls = { loseUpdate: false };
  async function run<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) {
    const pending = structuredClone(state);
    const tx = {
      async $queryRaw(query: Prisma.Sql) {
        queries.push(query);
        return pending.row?.id === query.values[0]
          ? [structuredClone(pending.row)]
          : [];
      },
      tripDocumentCleanupJob: {
        async updateMany({
          where,
          data,
        }: {
          where: {
            id: string;
            disposition: string;
            expiresAt: { gt?: Date; lte?: Date };
          };
          data: Partial<typeof initial>;
        }) {
          const row = pending.row;
          if (
            controls.loseUpdate ||
            !row ||
            row.id !== where.id ||
            row.disposition !== where.disposition ||
            (where.expiresAt.gt && row.expiresAt <= where.expiresAt.gt) ||
            (where.expiresAt.lte && row.expiresAt > where.expiresAt.lte)
          )
            return { count: 0 };
          Object.assign(row, data);
          return { count: 1 };
        },
      },
      tripDocument: {
        async update() {
          pending.pointer = receipt.key;
        },
      },
    } as unknown as Prisma.TransactionClient;
    const result = await work(tx);
    Object.assign(state, pending);
    return result;
  }
  return { state, queries, run, controls };
}
const adopt = (tx: Prisma.TransactionClient) =>
  tx.tripDocument
    .update({
      where: { id: receipt.documentId! },
      data: { storageKey: receipt.key },
    })
    .then(() => {});

describe("document candidate lifecycle", () => {
  it.each(["publication", "preview"] as const)(
    "retains pending %s atomically",
    async (purpose) => {
      const expected = {
        ...receipt,
        purpose,
        documentId: purpose === "preview" ? null : "document",
      };
      const fake = database("pending", expected);
      const result = await fake.run((tx) =>
        retain(tx, expected, adopt, () => now),
      );
      expect(result).toBe("adopted");
      expect(fake.state.row?.disposition).toBe("retained");
      expect(fake.state.pointer).toBe(receipt.key);
      expect(fake.queries).toHaveLength(1);
      expect(fake.queries[0].text).toContain('"trip_document_cleanup_jobs"');
      expect(fake.queries[0].text).toContain("FOR UPDATE");
      expect(fake.queries[0].values).toEqual([expected.id]);
    },
  );
  it.each(["pending", "retained"])(
    "checks every immutable field on %s receipts",
    async (state) => {
      for (const field of Object.keys(receipt) as (keyof typeof receipt)[]) {
        const fake = database(state);
        const wrong = {
          ...receipt,
          [field]: field === "revision" ? 3 : "wrong",
        };
        const callback = vi.fn();
        await expect(
          fake.run((tx) => retain(tx, wrong, callback, () => now)),
        ).rejects.toThrow("DOCUMENT_CANDIDATE_MISMATCH");
        expect(callback).not.toHaveBeenCalled();
        expect(fake.state.row?.disposition).toBe(state);
      }
    },
  );
  it.each(["pending", "retained", "delete"])(
    "reconciles durable %s without current-pointer inference",
    async (state) => {
      const fake = database(state);
      fake.state.pointer = "a-newer-publication";
      expect(await fake.run((tx) => reconcile(tx, receipt))).toBe(state);
      expect(fake.state.row?.disposition).toBe(state);
      expect(fake.state.pointer).toBe("a-newer-publication");
    },
  );
  it("does not rerun pending adoption for an expired retained receipt", async () => {
    const fake = database("retained");
    const callback = vi.fn();
    expect(
      await fake.run((tx) => retain(tx, receipt, callback, () => now + 60000)),
    ).toBe("retained");
    expect(callback).not.toHaveBeenCalled();
    expect(fake.state.row?.targets.keys).toEqual([receipt.key]);
  });
  it.each(["delete", "expired", "lost update", "missing"])(
    "rejects %s without adoption",
    async (reason) => {
      const fake = database(reason === "delete" ? "delete" : "pending");
      if (reason === "missing") fake.state.row = undefined;
      if (reason === "lost update") fake.controls.loseUpdate = true;
      const callback = vi.fn();
      const time = reason === "expired" ? now + 60000 : now;
      await expect(
        fake.run((tx) => retain(tx, receipt, callback, () => time)),
      ).rejects.toThrow();
      expect(callback).not.toHaveBeenCalled();
      expect(fake.state.pointer).toBe("old");
    },
  );
  it.each([
    null,
    { keys: [receipt.key], prefixes: ["unexpected"] },
    { keys: [receipt.key, "extra"], prefixes: [] },
  ])("rejects mismatched stored exact targets %j", async (targets) => {
    const fake = database();
    fake.state.row!.targets = targets as { keys: string[]; prefixes: never[] };
    await expect(fake.run((tx) => reconcile(tx, receipt))).rejects.toThrow(
      "DOCUMENT_CANDIDATE_MISMATCH",
    );
  });
  it("rolls back receipt and pointer when the pending-only callback throws", async () => {
    const fake = database();
    const before = structuredClone(fake.state);
    const failure = new Error("revision/link check failed");
    await expect(
      fake.run((tx) =>
        retain(
          tx,
          receipt,
          async (sameTx) => {
            expect(sameTx).toBe(tx);
            await adopt(sameTx);
            throw failure;
          },
          () => now,
        ),
      ),
    ).rejects.toBe(failure);
    expect(fake.state).toEqual(before);
  });
  it("snapshots expected identity while awaiting receipt locks", async () => {
    const fake = database();
    const source = { ...receipt };
    const pending = fake.run((tx) => retain(tx, source, adopt, () => now));
    source.revision = 99;
    source.key = "changed";
    expect(await pending).toBe("adopted");
    expect(fake.state.pointer).toBe(receipt.key);
  });
  it("samples expiry after locking", async () => {
    const fake = database();
    let time = now;
    const pending = fake.run((tx) => retain(tx, receipt, adopt, () => time));
    time += 60000;
    await expect(pending).rejects.toThrow("DOCUMENT_CANDIDATE_UNAVAILABLE");
    expect(fake.state.pointer).toBe("old");
  });
  it.each([
    ["pending", now, false],
    ["pending", now + 60000, true],
    ["retained", now + 60000, false],
    ["delete", now + 60000, false],
    ["missing", now + 60000, false],
  ] as const)(
    "expires %s at %s without parent access",
    async (state, time, changed) => {
      const fake = database(state);
      if (state === "missing") fake.state.row = undefined;
      expect(await fake.run((tx) => expire(tx, receipt.id, () => time))).toBe(
        changed,
      );
      expect(fake.queries).toEqual([]);
      if (changed)
        expect(fake.state.row).toMatchObject({
          disposition: "delete",
          nextAttemptAt: new Date(time),
          targets: { keys: [receipt.key], prefixes: [] },
        });
    },
  );
  it.each(["expiry-first", "adoption-first"])(
    "honors serialized %s ordering",
    async (order) => {
      const fake = database();
      if (order === "expiry-first") {
        await fake.run((tx) => expire(tx, receipt.id, () => now + 60000));
        await expect(
          fake.run((tx) => retain(tx, receipt, adopt, () => now)),
        ).rejects.toThrow("DOCUMENT_CANDIDATE_UNAVAILABLE");
      } else {
        await fake.run((tx) => retain(tx, receipt, adopt, () => now));
        expect(
          await fake.run((tx) => expire(tx, receipt.id, () => now + 60000)),
        ).toBe(false);
      }
      expect(fake.state.row?.disposition).toBe(
        order === "expiry-first" ? "delete" : "retained",
      );
    },
  );
  it.each([NaN, Infinity, Number.MAX_SAFE_INTEGER])(
    "rejects invalid clock %s without state changes",
    async (time) => {
      const fake = database();
      const before = structuredClone(fake.state);
      await expect(
        fake.run((tx) => retain(tx, receipt, adopt, () => time)),
      ).rejects.toThrow();
      await expect(
        fake.run((tx) => expire(tx, receipt.id, () => time)),
      ).rejects.toThrow();
      expect(fake.state).toEqual(before);
    },
  );
});
