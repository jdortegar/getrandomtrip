// @vitest-environment node
import type { Prisma, TripDocumentCleanupJob } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import type { TripDocumentCancellationScope } from "@/lib/types/TripDocumentCancellation";
import type { TripDocumentCandidateReceipt } from "@/lib/types/TripDocumentCandidate";
import { cancelDocumentCandidates as cancel } from "../tripDocumentCancellation";
import { retainDocumentCandidate as retain } from "../tripDocumentCandidateLifecycle";

const now = Date.parse("2026-09-23T12:00:00Z");
const clock = () => now;
const draft = {
  kind: "draft" as const,
  ownerId: "buyer",
  tripRequestId: "trip",
  id: "draft",
};
function candidate(
  id: string,
  patch: Partial<TripDocumentCleanupJob> = {},
): TripDocumentCleanupJob {
  return {
    id,
    ownerId: "buyer",
    tripRequestId: "trip",
    draftId: "draft",
    documentId: "document",
    previewId: "preview",
    revision: 1,
    purpose: "preview",
    disposition: "pending",
    targets: { keys: [`key/${id}`], prefixes: [] },
    expiresAt: new Date(now + 60000),
    nextAttemptAt: new Date(now - 1000),
    attempts: 3,
    lastError: "prior error",
    createdAt: new Date(now - 2000),
    ...patch,
  };
}
function database(initial: TripDocumentCleanupJob[]) {
  const rows = structuredClone(initial);
  const queries: Prisma.Sql[] = [];
  const updates: unknown[] = [];
  const controls = { fail: false };
  async function run<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) {
    const pending = structuredClone(rows);
    const tx = {
      async $queryRaw(query: Prisma.Sql) {
        queries.push(query);
        const clauses = [...query.text.matchAll(/"(\w+)" = \$(\d+)/g)];
        return pending
          .filter((row) =>
            clauses.every(
              ([, field, index]) =>
                row[field as keyof typeof row] ===
                query.values[Number(index) - 1],
            ),
          )
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((row) => structuredClone(row));
      },
      tripDocumentCleanupJob: {
        async updateMany({
          where,
          data,
        }: {
          where: {
            id: string | { in: string[] };
            disposition: string | { not: string };
          };
          data: Partial<TripDocumentCleanupJob>;
        }) {
          if (controls.fail) throw new Error("storage metadata unavailable");
          updates.push({ where, data });
          const matches = pending.filter(
            (row) =>
              (typeof where.id === "string"
                ? row.id === where.id
                : where.id.in.includes(row.id)) &&
              (typeof where.disposition === "string"
                ? row.disposition === where.disposition
                : row.disposition !== where.disposition.not),
          );
          matches.forEach((row) => Object.assign(row, data));
          return { count: matches.length };
        },
      },
    } as unknown as Prisma.TransactionClient;
    const result = await work(tx);
    rows.splice(0, rows.length, ...pending);
    return result;
  }
  return { rows, queries, updates, controls, run };
}

describe("cancelDocumentCandidates", () => {
  it("revokes a draft preview without changing its identity or targets", async () => {
    const original = candidate("preview");
    const fake = database([original]);
    expect(await fake.run((tx) => cancel(tx, draft, clock))).toBe(1);
    expect(fake.rows).toEqual([
      { ...original, disposition: "delete", nextAttemptAt: new Date(now) },
    ]);
  });
  it.each([
    ["draft", ["a", "m", "z"]],
    ["document", ["m", "r", "s"]],
    ["trip", ["a", "m", "o", "r", "s", "z"]],
    ["account", ["a", "m", "o", "r", "s", "t", "z"]],
  ] as const)(
    "cancels exactly the buyer-owned %s scope",
    async (kind, changed) => {
      const originals = [
        candidate("z"),
        candidate("a", { disposition: "retained" }),
        candidate("m", { purpose: "publication" }),
        candidate("r", { purpose: "publication", disposition: "retained" }),
        candidate("s", {
          purpose: "publication",
          disposition: "retained",
          draftId: "older",
        }),
        candidate("o", { draftId: "other", documentId: "other" }),
        candidate("t", { tripRequestId: "other-trip" }),
        candidate("x", { ownerId: "other-owner" }),
        candidate("terminal", { disposition: "delete" }),
        candidate("scope-job", { purpose: "scope" }),
      ];
      const fake = database(originals);
      const scope = {
        ...draft,
        kind,
        id: kind === "document" ? "document" : "draft",
      };
      expect(await fake.run((tx) => cancel(tx, scope, clock))).toBe(
        changed.length,
      );
      expect(fake.rows).toEqual(
        originals.map((row) =>
          (changed as readonly string[]).includes(row.id)
            ? { ...row, disposition: "delete", nextAttemptAt: new Date(now) }
            : row,
        ),
      );
      expect(fake.queries).toHaveLength(1);
      expect(fake.queries[0].text).toContain('ORDER BY "id" FOR UPDATE');
      expect(fake.updates).toEqual([
        {
          where: { id: { in: changed }, disposition: { not: "delete" } },
          data: { disposition: "delete", nextAttemptAt: new Date(now) },
        },
      ]);
    },
  );
  it("keeps repeated cancellation and existing terminal scheduling unchanged", async () => {
    const fake = database([
      candidate("active"),
      candidate("terminal", { disposition: "delete" }),
    ]);
    await fake.run((tx) => cancel(tx, draft, clock));
    const once = structuredClone(fake.rows);
    expect(await fake.run((tx) => cancel(tx, draft, () => now + 1000))).toBe(0);
    expect(fake.rows).toEqual(once);
    expect(fake.updates).toHaveLength(1);
  });
  it.each([
    { kind: "unknown" },
    { ownerId: "" },
    { tripRequestId: "" },
    { id: "" },
    { kind: "trip", tripRequestId: undefined },
    { kind: "document", id: undefined },
  ])("rejects incomplete/invalid scopes before locking %j", async (patch) => {
    const fake = database([candidate("preview")]);
    await expect(
      fake.run((tx) =>
        cancel(
          tx,
          { ...draft, ...patch } as TripDocumentCancellationScope,
          clock,
        ),
      ),
    ).rejects.toThrow("INVALID_DOCUMENT_CANCELLATION_SCOPE");
    expect(fake.queries).toEqual([]);
    expect(fake.updates).toEqual([]);
  });
  it.each([NaN, Infinity, Number.MAX_SAFE_INTEGER])(
    "rejects invalid time %s without writes",
    async (time) => {
      const fake = database([candidate("preview")]);
      await expect(
        fake.run((tx) => cancel(tx, draft, () => time)),
      ).rejects.toThrow("INVALID_DOCUMENT_CANDIDATE_CLOCK");
      expect(fake.rows[0].disposition).toBe("pending");
      expect(fake.updates).toEqual([]);
    },
  );
  it.each(["update", "outer callback"])(
    "preserves rollback contract on %s failure",
    async (reason) => {
      const fake = database([candidate("preview")]);
      const before = structuredClone(fake.rows);
      fake.controls.fail = reason === "update";
      await expect(
        fake.run(async (tx) => {
          await cancel(tx, draft, clock);
          throw new Error("outer failure");
        }),
      ).rejects.toThrow(
        reason === "update" ? "storage metadata unavailable" : "outer failure",
      );
      expect(fake.rows).toEqual(before);
    },
  );
  it.each(["cancel-first", "adopt-first"])(
    "serializes retained publication safety %s",
    async (order) => {
      const row = candidate("publication", { purpose: "publication" });
      const receipt = {
        ...row,
        key: "key/publication",
        expiresAt: row.expiresAt!.toISOString(),
      } as TripDocumentCandidateReceipt;
      const fake = database([row]);
      const adopt = vi.fn(async () => {});
      if (order === "cancel-first") {
        await fake.run((tx) => cancel(tx, draft, clock));
        await expect(
          fake.run((tx) => retain(tx, receipt, adopt, clock)),
        ).rejects.toThrow("DOCUMENT_CANDIDATE_UNAVAILABLE");
        expect(adopt).not.toHaveBeenCalled();
      } else {
        await fake.run((tx) => retain(tx, receipt, adopt, clock));
        expect(await fake.run((tx) => cancel(tx, draft, clock))).toBe(0);
        expect(adopt).toHaveBeenCalledOnce();
      }
      expect(fake.rows[0].disposition).toBe(
        order === "cancel-first" ? "delete" : "retained",
      );
    },
  );
  it("snapshots scope and parameterizes identifiers", async () => {
    const fake = database([candidate("preview")]);
    const source = { ...draft, id: "' OR 1=1 --" };
    const pending = fake.run((tx) => cancel(tx, source, clock));
    source.id = "draft";
    expect(await pending).toBe(0);
    expect(fake.queries[0].values).toContain("' OR 1=1 --");
    expect(fake.queries[0].text).not.toContain("' OR 1=1 --");
    expect(fake.rows[0].disposition).toBe("pending");
  });
  it("captures the scope kind before waiting for locks", async () => {
    const original = candidate("published", {
      purpose: "publication",
      disposition: "retained",
    });
    const fake = database([original]);
    const source: TripDocumentCancellationScope = { ...draft };
    const pending = fake.run((tx) => cancel(tx, source, clock));
    source.kind = "document";
    expect(await pending).toBe(0);
    expect(fake.rows).toEqual([original]);
  });
  it.each(["document", "trip", "account"] as const)(
    "prevents retained retry after %s cancellation",
    async (kind) => {
      const row = candidate("publication", {
        purpose: "publication",
        disposition: "retained",
      });
      const receipt = {
        ...row,
        key: "key/publication",
        expiresAt: row.expiresAt!.toISOString(),
      } as TripDocumentCandidateReceipt;
      const fake = database([row]);
      await fake.run((tx) =>
        cancel(tx, { ...draft, kind, id: "document" }, clock),
      );
      const adopt = vi.fn(async () => {});
      await expect(
        fake.run((tx) => retain(tx, receipt, adopt, clock)),
      ).rejects.toThrow("DOCUMENT_CANDIDATE_UNAVAILABLE");
      expect(fake.rows[0].disposition).toBe("delete");
      expect(adopt).not.toHaveBeenCalled();
    },
  );
});
