// @vitest-environment node
import type { Prisma, PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { registerDocumentCandidate as register } from "../tripDocumentCandidates";
import type { TripDocumentCandidateInput as CandidateInput } from "@/lib/types/TripDocumentCandidate";

const uuid = "00000000-0000-4000-8000-000000000001";
const now = Date.parse("2026-09-23T12:00:00Z");
const input = {
  ownerId: "buyer",
  tripRequestId: "trip",
  draftId: "draft",
  revision: 2,
  purpose: "preview" as const,
  expiresAt: new Date(now + 60000),
};
const clock = { randomId: () => uuid, now: () => now };
const publication = (
  state: "reserved" | "existing" = "existing",
): CandidateInput => ({
  ...input,
  purpose: "publication",
  previewId: "preview",
  document: { id: "document", state },
});
function database(failure?: "create" | "commit") {
  const rows: Record<string, Record<string, unknown>[]> = {
    users: [{ id: "buyer" }],
    trip_requests: [{ id: "trip", userId: "buyer" }],
    trip_document_drafts: [{ id: "draft", tripRequestId: "trip" }],
    trip_documents: [{ id: "document", tripRequestId: "trip" }],
  };
  const stored: Record<string, unknown>[] = [];
  const events: string[] = [];
  const db = {
    async $transaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) {
      const pending = structuredClone(stored);
      const tx = {
        async $queryRaw(query: Prisma.Sql) {
          const table = query.text.match(/FROM "([^"]+)"/)![1];
          events.push(table);
          return rows[table].filter((row) => query.values.includes(row.id));
        },
        tripDocumentCleanupJob: {
          async create({ data }: { data: Record<string, unknown> }) {
            if (failure === "create") throw new Error("create failed");
            if (pending.some((row) => row.id === data.id))
              throw new Error("P2002");
            events.push("create");
            pending.push(structuredClone(data));
            return data;
          },
        },
      } as unknown as Prisma.TransactionClient;
      const result = await work(tx);
      if (failure === "commit") throw new Error("commit failed");
      stored.splice(0, stored.length, ...pending);
      events.push("commit");
      return result;
    },
  } as Pick<PrismaClient, "$transaction">;
  return { db, rows, stored, events };
}
async function rejectsInvalid(candidate: CandidateInput, runtime = clock) {
  const fake = database();
  await expect(register(fake.db, candidate, runtime)).rejects.toThrow(
    "INVALID_DOCUMENT_CANDIDATE",
  );
  expect(fake.stored).toEqual([]);
  return fake;
}
describe("registerDocumentCandidate", () => {
  it.each([
    "%2e%2e",
    "trip%2Fother",
    "trip?query",
    "trip#fragment",
    "trip space",
    " trip",
    "trip ",
    "trip\tname",
    "trip\nname",
    "trip\rname",
    "trip\u00a0name",
    "trip\u0000name",
    "trip\u001fname",
    "trip\u007fname",
    ".",
    "..",
    "a/b",
    "a\\b",
  ])("rejects unsafe identity segment %j before locking", async (value) => {
    for (const field of [
      "ownerId",
      "tripRequestId",
      "draftId",
      "previewId",
      "document",
    ] as const) {
      const candidate = publication("reserved");
      if (field === "document") candidate.document!.id = value;
      else candidate[field] = value;
      const fake = await rejectsInvalid(candidate);
      expect(fake.events).toEqual([]);
    }
  });
  it("commits an exact-key preview candidate before returning storage instructions", async () => {
    const fake = database();
    const result = await register(fake.db, input, clock);
    expect(result).toMatchObject({
      id: uuid,
      previewId: uuid,
      documentId: null,
      key: `generated/trip/drafts/draft/${uuid}`,
    });
    expect(fake.stored).toEqual([
      expect.objectContaining({
        ...input,
        id: uuid,
        documentId: null,
        previewId: uuid,
        disposition: "pending",
        targets: { keys: [result.key], prefixes: [] },
      }),
    ]);
    expect(fake.events).toEqual([
      "users",
      "trip_requests",
      "trip_document_drafts",
      "create",
      "commit",
    ]);
    expect(() => Object.assign(result, { key: "changed" })).toThrow(TypeError);
  });

  it.each(["reserved", "existing"] as const)(
    "registers publication with an explicitly %s document identity",
    async (state) => {
      const fake = database();
      if (state === "reserved") fake.rows.trip_documents = [];
      const result = await register(fake.db, publication(state), clock);
      expect(result).toMatchObject({
        documentId: "document",
        previewId: "preview",
        purpose: "publication",
        key: `generated/trip/documents/document/${uuid}`,
      });
      expect(fake.stored[0]).toMatchObject({
        documentId: "document",
        previewId: "preview",
        targets: { keys: [result.key], prefixes: [] },
      });
      expect(fake.events.includes("trip_documents")).toBe(state === "existing");
    },
  );

  it.each([
    { purpose: "other" },
    { revision: 0 },
    { revision: 1.5 },
    { revision: 2147483648 },
    { revision: Number.MAX_SAFE_INTEGER },
    { expiresAt: new Date(NaN) },
    { expiresAt: new Date(now) },
    { expiresAt: new Date(now - 1) },
    { tripRequestId: "../outside" },
    { draftId: ".." },
    { draftId: "" },
    { ownerId: "" },
    { purpose: "publication" },
    {
      purpose: "publication",
      previewId: "preview",
      document: { id: "document", state: "other" },
    },
    { purpose: "preview", document: { id: "document", state: "existing" } },
    { purpose: "preview", previewId: "forged" },
  ])("rejects invalid registration %j without persisting", async (patch) => {
    const fake = await rejectsInvalid({ ...input, ...patch } as CandidateInput);
    expect(fake.events).not.toContain("create");
    if ("revision" in patch) expect(fake.events).toEqual([]);
  });

  it("rejects a colliding ID without changing the original candidate", async () => {
    const fake = database();
    await register(fake.db, input, clock);
    const saved = structuredClone(fake.stored);
    await expect(
      register(fake.db, { ...input, revision: 3 }, clock),
    ).rejects.toThrow("P2002");
    expect(fake.stored).toEqual(saved);
  });

  it("allocates separate server UUIDs/keys for repeated registrations", async () => {
    const fake = database();
    const first = await register(fake.db, input, { now: clock.now });
    const second = await register(fake.db, input, { now: clock.now });
    expect(first.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(second.id).not.toBe(first.id);
    expect(second.key).not.toBe(first.key);
    expect(fake.stored).toHaveLength(2);
  });

  it.each(["create", "commit"] as const)(
    "does not return a writable key after %s failure",
    async (failure) => {
      const fake = database(failure);
      await expect(register(fake.db, input, clock)).rejects.toThrow(
        `${failure} failed`,
      );
      expect(fake.stored).toEqual([]);
      expect(fake.events).not.toContain("commit");
    },
  );

  it.each([
    { randomId: () => "../unsafe" },
    { randomId: () => "not-a-uuid" },
    { now: () => NaN },
    { now: () => Infinity },
  ])(
    "rejects invalid server generators before persistence",
    async (dependency) => {
      await rejectsInvalid(input, { ...clock, ...dependency });
    },
  );

  it.each([
    ["users", null],
    ["trip_requests", "userId"],
    ["trip_document_drafts", "tripRequestId"],
    ["trip_documents", "tripRequestId"],
  ] as const)(
    "fails closed on changed live %s ownership",
    async (table, field) => {
      const fake = database();
      if (field === null) fake.rows[table] = [];
      else fake.rows[table][0][field] = "outsider";
      await expect(register(fake.db, publication(), clock)).rejects.toThrow(
        "DOCUMENT_LOCK_SCOPE_MISMATCH",
      );
      expect(fake.stored).toEqual([]);
      expect(fake.events).not.toContain("create");
    },
  );

  it("snapshots identity and expiry while waiting for ordered locks", async () => {
    const fake = database();
    const source = structuredClone(input);
    const pending = register(fake.db, source, clock);
    source.ownerId = "outsider";
    source.revision = 99;
    source.expiresAt.setTime(now - 1);
    const result = await pending;
    expect(result).toMatchObject({
      ownerId: "buyer",
      revision: 2,
      expiresAt: new Date(now + 60000).toISOString(),
    });
    expect(fake.stored[0]).toMatchObject({
      ownerId: "buyer",
      revision: 2,
      expiresAt: input.expiresAt,
    });
  });

  it("checks expiry after acquiring locks rather than at request start", async () => {
    const fake = database();
    let current = now;
    const pending = register(fake.db, input, { ...clock, now: () => current });
    current = input.expiresAt.getTime();
    await expect(pending).rejects.toThrow("INVALID_DOCUMENT_CANDIDATE");
    expect(fake.events).toEqual([
      "users",
      "trip_requests",
      "trip_document_drafts",
    ]);
    expect(fake.stored).toEqual([]);
  });

  it.each([
    ["a", 538],
    ["é", 269],
  ] as const)(
    "bounds complete UTF-8 keys with %s",
    async (character, count) => {
      const candidate = publication("reserved");
      candidate.document!.id = character.repeat(count);
      candidate.revision = 2147483647;
      const valid = database();
      const result = await register(valid.db, candidate, clock);
      expect(Buffer.byteLength(result.key, "utf8")).toBe(600);
      expect(valid.stored[0].revision).toBe(2147483647);
      candidate.document!.id += "a";
      const rejected = await rejectsInvalid(candidate);
      expect(rejected.events).toEqual([]);
    },
  );
});
