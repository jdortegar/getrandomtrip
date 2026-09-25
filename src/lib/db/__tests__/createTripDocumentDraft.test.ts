// @vitest-environment node
import type { Prisma, PrismaClient } from "@prisma/client";
import { expect, it, vi } from "vitest";
import {
  createTripDocumentDraft,
  readTripDocumentDraft,
} from "../createTripDocumentDraft";
const scope = { ownerId: "buyer", tripRequestId: "trip" };
function database() {
  let saved: Record<string, unknown> | null = null;
  let owner = "buyer";
  let fail = false;
  const events: string[] = [];
  const db = {
    async $transaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) {
      let pending = saved && structuredClone(saved);
      const tx = {
        async $queryRaw(query: Prisma.Sql) {
          const table = query.text.match(/FROM "([^"]+)"/)![1];
          events.push(table);
          if (table === "users") return [{ id: "buyer" }];
          if (table === "trip_requests") return [{ id: "trip", userId: owner }];
          return pending ? [{ id: "draft", tripRequestId: "trip" }] : [];
        },
        tripDocumentDraft: {
          async create({ data }: { data: Record<string, unknown> }) {
            events.push("create");
            pending = {
              ...data,
              id: "draft",
              revision: 1,
              documentId: null,
              publishedRevision: null,
              previewId: null,
              previewRevision: null,
              previewKey: "private",
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            return pending;
          },
          async findUnique() {
            return pending;
          },
        },
      } as unknown as Prisma.TransactionClient;
      const result = await work(tx);
      if (fail) throw new Error("rollback");
      saved = pending;
      return result;
    },
  } as Pick<PrismaClient, "$transaction">;
  return {
    db,
    events,
    get saved() {
      return saved;
    },
    changeOwner() {
      owner = "other";
    },
    failCommit() {
      fail = true;
    },
  };
}
const source = () => ({
  trip: {
    user: { name: "Original buyer", locale: "en" },
    originCity: "Rosario",
  },
  provider: {
    kind: "experience" as const,
    hotels: [{ name: "Selected hotel", location: "Address" }],
  },
});
it.each([
  "hotel-voucher",
  "activity-voucher",
  "dinner-voucher",
  "experience-roadmap",
  "xsed-roadmap",
] as const)(
  "creates private %s from locked creation-only facts",
  async (template) => {
    const fake = database();
    const load = vi.fn(async () => source());
    const result = await createTripDocumentDraft(
      fake.db,
      scope,
      { template },
      load,
    );
    expect(result).toMatchObject({
      ok: true,
      value: {
        revision: 1,
        document: { template, locale: "en" },
        documentId: null,
      },
    });
    expect(fake.events).toEqual(["users", "trip_requests", "create"]);
    expect(load).toHaveBeenCalledOnce();
    expect(JSON.stringify(result)).not.toContain("private");
  },
);
it("requires explicit candidate selection and never refreshes reads", async () => {
  const fake = database();
  const facts = source();
  const result = await createTripDocumentDraft(
    fake.db,
    scope,
    { template: "hotel-voucher", candidateIndex: 0 },
    async () => facts,
  );
  expect(result).toMatchObject({
    ok: true,
    value: {
      document: {
        data: {
          holder: "Original buyer",
          property: { name: "Selected hotel" },
        },
      },
    },
  });
  facts.trip.user.name = "Changed buyer";
  expect(
    await readTripDocumentDraft(fake.db, { ...scope, draftId: "draft" }),
  ).toMatchObject({ document: { data: { holder: "Original buyer" } } });
  expect(JSON.stringify(fake.saved)).not.toContain("paymentWording");
});
it("rejects client metadata and invalid candidate input before source reads", async () => {
  const fake = database();
  const load = vi.fn(async () => source());
  for (const input of [
    { template: "unknown" },
    { template: "hotel-voucher", locale: "en" },
    { template: "hotel-voucher", candidateIndex: -1 },
  ])
    expect(
      (await createTripDocumentDraft(fake.db, scope, input, load)).ok,
    ).toBe(false);
  expect(load).not.toHaveBeenCalled();
  expect(fake.events).toEqual([]);
});
it("rejects changed ownership for creation/read and rolls back failed creation", async () => {
  const fake = database();
  fake.changeOwner();
  await expect(
    createTripDocumentDraft(
      fake.db,
      scope,
      { template: "hotel-voucher" },
      async () => source(),
    ),
  ).rejects.toThrow("DOCUMENT_LOCK_SCOPE_MISMATCH");
  await expect(
    readTripDocumentDraft(fake.db, { ...scope, draftId: "draft" }),
  ).rejects.toThrow("DOCUMENT_LOCK_SCOPE_MISMATCH");
  const rollback = database();
  rollback.failCommit();
  await expect(
    createTripDocumentDraft(
      rollback.db,
      scope,
      { template: "hotel-voucher" },
      async () => source(),
    ),
  ).rejects.toThrow("rollback");
  expect(rollback.saved).toBe(null);
});

it.each(["selected", null])(
  "passes explicit source %j to the locked trusted loader",
  async (experienceId) => {
    const fake = database();
    const load = vi.fn(async () => source());
    const result = await createTripDocumentDraft(
      fake.db,
      scope,
      { template: "hotel-voucher", experienceId },
      load,
    );
    expect(result.ok).toBe(true);
    expect(load).toHaveBeenCalledWith(expect.anything(), "trip", experienceId);
    expect(fake.events).toEqual(["users", "trip_requests", "create"]);
  },
);
it.each(["", " ", 1, {}, ["selected"]])(
  "rejects invalid source override %j",
  async (experienceId) => {
    const fake = database();
    const load = vi.fn(async () => source());
    expect(
      (
        await createTripDocumentDraft(
          fake.db,
          scope,
          { template: "hotel-voucher", experienceId },
          load,
        )
      ).ok,
    ).toBe(false);
    expect(load).not.toHaveBeenCalled();
  },
);
