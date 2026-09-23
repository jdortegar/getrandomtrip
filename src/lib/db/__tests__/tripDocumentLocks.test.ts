// @vitest-environment node
import { Prisma, type PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { withTripDocumentLocks as withLocks } from "../tripDocumentLocks";
import type { TripDocumentLockScope } from "@/lib/types/TripDocumentLocks";

const refs = (prefix: string) =>
  ["z", "a"].map((tripRequestId) => ({
    id: prefix + tripRequestId,
    tripRequestId,
  }));
const scope = {
  ownerId: "buyer",
  tripIds: ["z", "a", "z"],
  drafts: refs("d"),
  documents: refs("p"),
  cleanupJobs: refs("j"),
};
const ownedRows = () => ({
  "users:buyer": { id: "buyer" },
  ...Object.fromEntries(
    ["a", "z"].map((id) => [`trip_requests:${id}`, { id, userId: "buyer" }]),
  ),
  ...Object.fromEntries(
    [
      ["trip_document_drafts", "d"],
      ["trip_documents", "p"],
      ["trip_document_cleanup_jobs", "j"],
    ].flatMap(([table, prefix]) =>
      ["a", "z"].map((tripRequestId) => {
        const id = prefix + tripRequestId;
        return [`${table}:${id}`, { id, tripRequestId, ownerId: "buyer" }];
      }),
    ),
  ),
});

function database(
  rows: Record<string, Record<string, unknown>>,
  beforeQuery = async () => {},
) {
  const events: string[] = [];
  const queries: Prisma.Sql[] = [];
  const tx = {
    async $queryRaw(query: Prisma.Sql) {
      await beforeQuery();
      queries.push(query);
      const table = query.text.match(/FROM "([^"]+)"/)![1];
      return query.values.flatMap((id) => {
        const key = `${table}:${id}`;
        events.push(key);
        return rows[key] ? [rows[key]] : [];
      });
    },
  } as unknown as Prisma.TransactionClient;
  const db = {
    async $transaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) {
      events.push("begin");
      try {
        const result = await work(tx);
        events.push("commit");
        return result;
      } catch (error) {
        events.push("rollback");
        throw error;
      }
    },
  } as Pick<PrismaClient, "$transaction">;
  return { db, tx, events, queries };
}

describe("withTripDocumentLocks", () => {
  it("locks the live buyer and owned trip before running the transaction callback", async () => {
    const fake = database({
      "users:buyer": { id: "buyer" },
      "trip_requests:trip": { id: "trip", userId: "buyer" },
    });
    const result = await withLocks(
      fake.db,
      {
        ownerId: "buyer",
        tripIds: ["trip"],
      },
      async (tx) => {
        expect(tx).toBe(fake.tx);
        fake.events.push("callback");
        return "saved";
      },
    );
    expect(result).toBe("saved");
    expect(fake.events).toEqual([
      "begin",
      "users:buyer",
      "trip_requests:trip",
      "callback",
      "commit",
    ]);
  });

  it("deduplicates and sorts every lock group without mutating the input", async () => {
    const input = structuredClone(scope);
    for (const group of [input.drafts, input.documents, input.cleanupJobs])
      group.push({ ...group[0] });
    const original = structuredClone(input);
    const fake = database(ownedRows());
    await withLocks(fake.db, input, async () => fake.events.push("callback"));
    expect(fake.events).toEqual([
      "begin",
      "users:buyer",
      "trip_requests:a",
      "trip_requests:z",
      "trip_document_drafts:da",
      "trip_document_drafts:dz",
      "trip_documents:pa",
      "trip_documents:pz",
      "trip_document_cleanup_jobs:ja",
      "trip_document_cleanup_jobs:jz",
      "callback",
      "commit",
    ]);
    expect(fake.queries.map((query) => query.values)).toEqual([
      ["buyer"],
      ["a", "z"],
      ["da", "dz"],
      ["pa", "pz"],
      ["ja", "jz"],
    ]);
    expect(
      fake.queries.every((query) =>
        /ORDER BY "id" FOR UPDATE$/.test(query.text),
      ),
    ).toBe(true);
    expect(input).toEqual(original);
  });

  it.each([
    ["users:buyer", null],
    ["trip_requests:a", null],
    ["trip_document_drafts:da", null],
    ["trip_documents:pa", null],
    ["trip_document_cleanup_jobs:ja", null],
    ["trip_requests:a", "userId"],
    ["trip_document_drafts:da", "tripRequestId"],
    ["trip_documents:pa", "tripRequestId"],
    ["trip_document_cleanup_jobs:ja", "ownerId"],
    ["trip_document_cleanup_jobs:ja", "tripRequestId"],
  ] as const)(
    "rejects missing/mismatched live %s.%s before callback",
    async (key, field) => {
      const rows: Record<string, Record<string, unknown>> = ownedRows();
      if (field === null) delete rows[key];
      else rows[key][field] = "outsider";
      const fake = database(rows);
      await expect(
        withLocks(fake.db, scope, async () => fake.events.push("callback")),
      ).rejects.toThrow("DOCUMENT_LOCK_SCOPE_MISMATCH");
      expect(fake.events).not.toContain("callback");
      expect(fake.events.at(-1)).toBe("rollback");
    },
  );

  it.each(
    (["drafts", "documents", "cleanupJobs"] as const).flatMap((group) => [
      {
        group,
        reason: "missing parent",
        input: { ownerId: "buyer", [group]: scope[group] },
      },
      {
        group,
        reason: "conflicting duplicate",
        input: {
          ...scope,
          [group]: [
            scope[group][0],
            { ...scope[group][0], tripRequestId: "a" },
          ],
        },
      },
    ]),
  )("rejects $reason in $group", async ({ input }) => {
    const fake = database(ownedRows());
    await expect(
      withLocks(fake.db, input, async () => fake.events.push("callback")),
    ).rejects.toThrow("DOCUMENT_LOCK_SCOPE_MISMATCH");
    expect(fake.events).not.toContain("callback");
  });

  it("preserves callback errors for the transaction runner to roll back", async () => {
    const fake = database(ownedRows());
    const error = new Error("callback failed");
    await expect(
      withLocks(fake.db, scope, async () => {
        throw error;
      }),
    ).rejects.toBe(error);
    expect(fake.events.at(-1)).toBe("rollback");
    expect(fake.events).not.toContain("commit");
    expect(fake.queries).toHaveLength(5);
  });

  it("propagates lock failures without invoking the callback", async () => {
    const error = new Error("lock unavailable");
    const fake = database(ownedRows(), async () => {
      throw error;
    });
    await expect(
      withLocks(fake.db, scope, async () => fake.events.push("callback")),
    ).rejects.toBe(error);
    expect(fake.events).toEqual(["begin", "rollback"]);
  });

  it("awaits locks and snapshots inputs before an asynchronous transaction starts", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fake = database(ownedRows(), () => gate);
    const input = structuredClone(scope);
    const pending = withLocks(fake.db, input, async () =>
      fake.events.push("callback"),
    );
    input.ownerId = "outsider";
    input.tripIds.length = 0;
    input.drafts[0].tripRequestId = "outsider";
    expect(fake.events).toEqual(["begin"]);
    release();
    await pending;
    expect(fake.events.slice(-2)).toEqual(["callback", "commit"]);
    expect(fake.queries[0].values).toEqual(["buyer"]);
    expect(fake.queries[1].values).toEqual(["a", "z"]);
  });

  it("accepts frozen scopes and keeps owner-only outbox locks parameterized", async () => {
    const ownerId = "buyer' OR 1=1 --";
    const input: TripDocumentLockScope = Object.freeze({
      ownerId,
      cleanupJobs: Object.freeze([
        Object.freeze({ id: "job", tripRequestId: null }),
      ]),
    });
    const fake = database({
      [`users:${ownerId}`]: { id: ownerId },
      "trip_document_cleanup_jobs:job": {
        id: "job",
        ownerId,
        tripRequestId: null,
      },
    });
    expect(await withLocks(fake.db, input, async () => "locked")).toBe(
      "locked",
    );
    expect(fake.queries.map((query) => query.values)).toEqual([
      [ownerId],
      ["job"],
    ]);
    expect(fake.queries.every((query) => !query.text.includes(ownerId))).toBe(
      true,
    );
  });
});
