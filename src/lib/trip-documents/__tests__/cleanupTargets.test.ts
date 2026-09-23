// @vitest-environment node
import { describe, expect, it } from "vitest";
import { planDocumentCleanup as plan } from "../cleanupTargets";
import type { TripDocumentCancellationScope } from "@/lib/types/TripDocumentCancellation";

const trip = { kind: "trip" as const, ownerId: "buyer", tripRequestId: "trip" };
const facts = {
  trips: [{ id: "trip", userId: "buyer" }],
  drafts: [{ id: "draft", tripRequestId: "trip" }],
  documents: [],
};

const uuid = "00000000-0000-4000-8000-000000000001";
const doc = { id: "doc", tripRequestId: "trip", storageKey: `trip/${uuid}` };
const withDoc = { ...facts, documents: [doc] };
const withKey = (storageKey: string) => ({
  ...facts,
  documents: [{ ...doc, storageKey }],
});
const targets = (jobs: ReturnType<typeof plan>) =>
  jobs.flatMap((job) => [...job.targets.keys, ...job.targets.prefixes]).sort();

describe("planDocumentCleanup", () => {
  it("derives a trip-specific terminal prefix job, never an owner/store prefix", () => {
    expect(plan(trip, facts)).toEqual([
      expect.objectContaining({
        ownerId: "buyer",
        tripRequestId: "trip",
        draftId: null,
        documentId: null,
        purpose: "scope-prefix",
        disposition: "delete",
        previewId: null,
        revision: null,
        expiresAt: null,
        targets: { keys: [], prefixes: ["generated/trip/"] },
      }),
    ]);
  });
  it.each(["draft", "document"] as const)(
    "limits %s deletion to its own namespace",
    (kind) => {
      const jobs = plan(
        { ...trip, kind, id: kind === "draft" ? "draft" : "doc" },
        withDoc,
      );
      expect(targets(jobs)).toEqual(
        kind === "draft"
          ? ["generated/trip/drafts/draft/"]
          : ["generated/trip/documents/doc/", doc.storageKey],
      );
      expect(
        jobs.every(
          (job) => job.targets.keys.length + job.targets.prefixes.length === 1,
        ),
      ).toBe(true);
    },
  );
  it("covers generated document bytes without an extra exact-key job", () => {
    const source = withKey(`generated/trip/documents/doc/${uuid}`);
    expect(targets(plan(trip, source))).toEqual(["generated/trip/"]);
  });
  it("expands an account into owned trips, including an empty account", () => {
    const account = { kind: "account" as const, ownerId: "buyer" };
    const owned = {
      ...withDoc,
      trips: [...facts.trips, { id: "second", userId: "buyer" }],
    };
    expect(targets(plan(account, owned))).toEqual([
      "generated/second/",
      "generated/trip/",
      doc.storageKey,
    ]);
    expect(
      plan(account, { ...owned, trips: [...owned.trips].reverse() }),
    ).toEqual(plan(account, owned));
    expect(plan(account, { trips: [], drafts: [], documents: [] })).toEqual([]);
    expect(() =>
      plan(account, {
        ...owned,
        trips: [...owned.trips, { id: "foreign", userId: "other" }],
      }),
    ).toThrow();
  });
  it("deduplicates reordered facts and uses stable domain-separated IDs", () => {
    const expected = plan(trip, withDoc);
    const duplicated = {
      ...withDoc,
      trips: [...facts.trips, ...facts.trips],
      documents: [doc, doc],
    };
    expect(plan(trip, duplicated)).toEqual(expected);
    expect(plan({ kind: "account", ownerId: "buyer" }, duplicated)).toEqual(
      expected,
    );
    expect(new Set(expected.map((job) => job.id)).size).toBe(2);
    expect(
      expected.every((job) => /^cleanup-v1-[0-9a-f]{64}$/.test(job.id)),
    ).toBe(true);
    const other = plan(
      { ...trip, ownerId: "another" },
      { ...withDoc, trips: [{ id: "trip", userId: "another" }] },
    );
    expect(other.map((job) => job.id)).not.toEqual(
      expected.map((job) => job.id),
    );
  });
  it.each([
    "",
    ".",
    "..",
    "trip/../other",
    "trip\\other",
    " trip",
    "trip\n",
    "trip\0",
    ...["%2e%2e", ".%2E", "%2E."],
    ...["?x", "#x", "trip?x", "trip#x"],
  ])("rejects unsafe namespace segment %j", (id) => {
    expect(() =>
      plan(
        { ...trip, tripRequestId: id },
        { ...facts, trips: [{ id, userId: "buyer" }] },
      ),
    ).toThrow("INVALID_DOCUMENT_CLEANUP_TARGET");
  });
  it.each([
    { ...trip, ownerId: "" },
    { ...trip, kind: "unknown" },
    { ...trip, tripRequestId: "missing" },
    { ...trip, ownerId: "outsider" },
    { ...trip, kind: "draft", id: "missing" },
    { ...trip, kind: "document", id: "missing" },
  ])("rejects invalid scope or missing ownership proof %j", (scope) => {
    expect(() => plan(scope as TripDocumentCancellationScope, withDoc)).toThrow(
      "INVALID_DOCUMENT_CLEANUP_TARGET",
    );
  });
  it.each([
    "",
    "/",
    "trip/",
    `foreign/${uuid}`,
    `trip/${uuid}/extra`,
    "trip/../other",
    "trip/not-a-uuid",
    `generated/trip/documents/other/${uuid}`,
    `generated/trip/drafts/draft/${uuid}`,
  ])("rejects unsafe or wrong-scope stored key %j", (storageKey) => {
    expect(() => plan(trip, withKey(storageKey))).toThrow(
      "INVALID_DOCUMENT_CLEANUP_TARGET",
    );
  });
  it("rejects conflicting or wrong-trip child facts", () => {
    expect(() =>
      plan(
        { ...trip, kind: "draft", id: "draft" },
        { ...facts, drafts: [{ id: "draft", tripRequestId: "foreign" }] },
      ),
    ).toThrow();
    expect(() =>
      plan(
        { ...trip, kind: "document", id: "doc" },
        { ...facts, documents: [{ ...doc, tripRequestId: "foreign" }] },
      ),
    ).toThrow();
    expect(() =>
      plan(trip, {
        ...facts,
        documents: [
          doc,
          { ...doc, storageKey: `trip/${uuid.replace(/1$/, "2")}` },
        ],
      }),
    ).toThrow();
    expect(() =>
      plan(trip, { ...facts, documents: [doc, { ...doc, id: "other" }] }),
    ).toThrow();
  });
  it.each([
    ["a".repeat(563), true],
    ["é".repeat(281) + "a", true],
    ["a".repeat(589), false],
    ["é".repeat(294) + "a", false],
  ] as const)("bounds complete UTF-8 targets (%s, legacy=%s)", (id, legacy) => {
    const make = (tripId: string) => ({
      ...facts,
      trips: [{ id: tripId, userId: "buyer" }],
      documents: legacy
        ? [{ ...doc, tripRequestId: tripId, storageKey: `${tripId}/${uuid}` }]
        : [],
    });
    const valid = targets(plan({ ...trip, tripRequestId: id }, make(id)));
    expect(valid.some((key) => Buffer.byteLength(key) === 600)).toBe(true);
    expect(() =>
      plan({ ...trip, tripRequestId: id + "a" }, make(id + "a")),
    ).toThrow("INVALID_DOCUMENT_CLEANUP_TARGET");
  });
  it("returns deep-frozen independent jobs without mutating frozen sources", () => {
    const source = structuredClone(withDoc);
    Object.freeze(source.trips[0]);
    Object.freeze(source.documents[0]);
    const first = plan(Object.freeze(trip), source);
    const before = JSON.stringify(first);
    const mutations = [
      () => (first as unknown[]).push({}),
      () => Object.assign(first[0], { ownerId: "outsider" }),
      () => (first[0].targets.prefixes as string[]).push(""),
      () => Object.assign(first[0].targets, { keys: [""] }),
    ];
    for (const mutate of mutations) expect(mutate).toThrow(TypeError);
    expect(plan(trip, source)[0]).not.toBe(first[0]);
    expect(JSON.stringify(first)).toBe(before);
  });
});
