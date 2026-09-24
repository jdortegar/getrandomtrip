// @vitest-environment node
import type { Prisma, TripDocumentCleanupJob } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { registerDocumentCleanup as register } from "../tripDocumentCleanupRegistration";
import { planDocumentCleanup } from "@/lib/trip-documents/cleanupTargets";

const now = Date.parse("2026-09-23T12:00:00Z");
const clock = () => now;
const scope = {
  kind: "trip" as const,
  ownerId: "buyer",
  tripRequestId: "trip",
};
const facts = {
  trips: [{ id: "trip", userId: "buyer" }],
  drafts: [],
  documents: [
    {
      id: "document",
      tripRequestId: "trip",
      storageKey: "trip/00000000-0000-4000-8000-000000000001",
    },
  ],
};
const plan = planDocumentCleanup(scope, facts);
function row(index = 0): TripDocumentCleanupJob {
  return {
    ...plan[index],
    targets: {
      keys: [...plan[index].targets.keys],
      prefixes: [...plan[index].targets.prefixes],
    },
    createdAt: new Date(now - 5000),
    nextAttemptAt: new Date(now + 9000),
    attempts: 3,
    lastError: "retry later",
  };
}
function database(initial: TripDocumentCleanupJob[] = []) {
  const rows = structuredClone(initial);
  const calls: string[] = [];
  const controls = { fail: "", mutate: undefined as undefined | (() => void) };
  async function run<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) {
    const pending = structuredClone(rows);
    const tx = {
      tripDocumentCleanupJob: {
        async createMany({
          data,
          skipDuplicates,
        }: {
          data: TripDocumentCleanupJob[];
          skipDuplicates: boolean;
        }) {
          calls.push("insert");
          expect(skipDuplicates).toBe(true);
          for (const item of data) {
            if (!pending.some((entry) => entry.id === item.id))
              pending.push(structuredClone(item));
          }
          controls.mutate?.();
          if (controls.fail === "insert") throw new Error("insert failed");
          return { count: data.length };
        },
        async findMany({ where }: { where: { id: { in: string[] } } }) {
          calls.push("read");
          if (controls.fail === "read") throw new Error("read failed");
          if (controls.fail === "missing") return [];
          return pending
            .filter((item) => where.id.in.includes(item.id))
            .map((item) => structuredClone(item));
        },
      },
    } as unknown as Prisma.TransactionClient;
    const result = await work(tx);
    if (controls.fail === "commit") throw new Error("commit failed");
    rows.splice(0, rows.length, ...pending);
    return result;
  }
  return { rows, calls, controls, run };
}

describe("registerDocumentCleanup", () => {
  it("persists one immutable job per prefix or legacy key in the caller transaction", async () => {
    const fake = database();
    const ids = await fake.run((tx) => register(tx, scope, facts, clock));
    expect(ids).toEqual(plan.map((job) => job.id));
    expect(fake.rows).toEqual(
      plan.map((job) => ({
        ...job,
        createdAt: new Date(now),
        nextAttemptAt: new Date(now),
        attempts: 0,
        lastError: null,
      })),
    );
    expect(fake.rows.map((job) => job.purpose).sort()).toEqual([
      "legacy-key",
      "scope-prefix",
    ]);
    expect(fake.calls).toEqual(["insert", "read"]);
  });
  it("retries without resetting immutable identities or scheduling metadata", async () => {
    const originals = plan.map((_, index) => row(index));
    const fake = database(originals);
    const reordered = {
      ...facts,
      documents: [...facts.documents, ...facts.documents],
    };
    expect(
      await fake.run((tx) => register(tx, scope, reordered, clock)),
    ).toEqual(plan.map((job) => job.id));
    expect(fake.rows).toEqual(originals);
  });
  it.each([
    { ownerId: "outsider" },
    { tripRequestId: "other" },
    { draftId: "draft" },
    { documentId: "other" },
    { previewId: "preview" },
    { revision: 1 },
    { purpose: "publication" },
    { disposition: "retained" },
    { disposition: "pending" },
    { expiresAt: new Date(now + 1000) },
    { targets: { keys: ["outside/key"], prefixes: [] } },
  ] as Partial<TripDocumentCleanupJob>[])(
    "rejects identity collisions %j and rolls back other inserts",
    async (patch) => {
      const original = { ...row(), ...patch };
      const fake = database([original]);
      await expect(
        fake.run((tx) => register(tx, scope, facts, clock)),
      ).rejects.toThrow("DOCUMENT_CLEANUP_TARGET_MISMATCH");
      expect(fake.rows).toEqual([original]);
    },
  );
  it.each([NaN, Infinity, 8640000000000001])(
    "rejects invalid clock %s before persistence",
    async (time) => {
      const fake = database();
      await expect(
        fake.run((tx) => register(tx, scope, facts, () => time)),
      ).rejects.toThrow("INVALID_DOCUMENT_CLEANUP_CLOCK");
      expect(fake.calls).toEqual([]);
      expect(fake.rows).toEqual([]);
    },
  );
  it.each(["insert", "read", "commit"])(
    "propagates %s failure for caller rollback",
    async (failure) => {
      const fake = database([row()]);
      fake.controls.fail = failure;
      await expect(
        fake.run((tx) => register(tx, scope, facts, clock)),
      ).rejects.toThrow(`${failure} failed`);
      expect(fake.rows).toEqual([row()]);
    },
  );
  it("keeps tombstones atomic with the caller's later deletion", async () => {
    const fake = database();
    await expect(
      fake.run(async (tx) => {
        await register(tx, scope, facts, clock);
        throw new Error("delete failed");
      }),
    ).rejects.toThrow("delete failed");
    expect(fake.rows).toEqual([]);
  });
  it("does not write an empty account plan", async () => {
    const fake = database();
    expect(
      await fake.run((tx) =>
        register(
          tx,
          { kind: "account", ownerId: "buyer" },
          { trips: [], drafts: [], documents: [] },
          clock,
        ),
      ),
    ).toEqual([]);
    expect(fake.calls).toEqual([]);
  });
  it("rejects invalid ownership before any persistence", async () => {
    const fake = database();
    await expect(
      fake.run((tx) =>
        register(tx, { ...scope, ownerId: "outsider" }, facts, clock),
      ),
    ).rejects.toThrow("INVALID_DOCUMENT_CLEANUP_TARGET");
    expect(fake.calls).toEqual([]);
  });
  it("snapshots facts before asynchronous persistence", async () => {
    const fake = database();
    const source = structuredClone(facts);
    fake.controls.mutate = () => {
      source.trips[0].id = "changed";
      source.documents[0].storageKey = "changed";
    };
    const ids = await fake.run((tx) => register(tx, scope, source, clock));
    expect(ids).toEqual(plan.map((job) => job.id));
    expect(fake.rows.map((job) => job.targets)).toEqual(
      plan.map((job) => job.targets),
    );
  });
  it("rejects missing receipt readback without committing inserted jobs", async () => {
    const fake = database();
    fake.controls.fail = "missing";
    await expect(
      fake.run((tx) => register(tx, scope, facts, clock)),
    ).rejects.toThrow("DOCUMENT_CLEANUP_TARGET_MISMATCH");
    expect(fake.rows).toEqual([]);
  });
  it("preserves unrelated retained candidate receipts", async () => {
    const candidate = {
      ...row(),
      id: "00000000-0000-4000-8000-000000000001",
      purpose: "publication",
      disposition: "retained" as const,
    };
    const fake = database([candidate]);
    await fake.run((tx) => register(tx, scope, facts, clock));
    expect(fake.rows).toHaveLength(3);
    expect(fake.rows.find((item) => item.id === candidate.id)).toEqual(
      candidate,
    );
  });
});
it("registers known uploaded keys without prefix jobs in exact-key mode", async () => {
  const fake = database();
  await fake.run((tx) =>
    register(tx, scope, facts, clock, { exactKeysOnly: true }),
  );
  expect(fake.rows).toHaveLength(1);
  expect(fake.rows[0].purpose).toBe("legacy-key");
  expect(fake.rows[0].targets).toEqual({
    keys: [facts.documents[0].storageKey],
    prefixes: [],
  });
});
