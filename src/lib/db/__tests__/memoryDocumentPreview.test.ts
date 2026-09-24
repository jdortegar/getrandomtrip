// @vitest-environment node
import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("../tripDocumentLocks", () => ({ withTripDocumentLocks: vi.fn() }));
import { withTripDocumentLocks } from "../tripDocumentLocks";
import {
  bindMemoryDocumentPreview,
  verifyMemoryDocumentPreview,
  createMemoryPreviewId,
} from "../memoryDocumentPreview";
const now = 1790000000000;
const scope = { ownerId: "owner", tripRequestId: "trip", draftId: "draft" };
const pdf = Buffer.from("%PDF-exact bytes");
const db = {} as Pick<PrismaClient, "$transaction">;
const update = vi.fn();
let row: Record<string, unknown>;
beforeEach(() => {
  vi.resetAllMocks();
  row = { id: "draft", tripRequestId: "trip", revision: 2 };
  vi.mocked(withTripDocumentLocks).mockImplementation(
    async (_db, _scope, work) =>
      work({
        tripDocumentDraft: {
          findUnique: async () => row,
          update: async (args: { data: object }) => {
            update(args);
            Object.assign(row, args.data);
          },
        },
      } as never),
  );
});
it("binds exact server bytes with live ordered scope, without any storage key or candidate", async () => {
  const result = await bindMemoryDocumentPreview(db, scope, 2, pdf, now);
  expect(result.previewId).toMatch(
    /^[a-f0-9]{8}-[a-f0-9]{4}-7[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
  );
  expect(withTripDocumentLocks).toHaveBeenCalledWith(
    db,
    {
      ownerId: "owner",
      tripIds: ["trip"],
      drafts: [{ id: "draft", tripRequestId: "trip" }],
    },
    expect.any(Function),
  );
  expect(row).toMatchObject({
    previewKey: null,
    previewId: result.previewId,
    previewRevision: 2,
    previewSize: pdf.length,
    previewHash: createHash("sha256").update(pdf).digest("hex"),
  });
  expect(
    verifyMemoryDocumentPreview(
      row as never,
      scope,
      2,
      result.previewId,
      pdf,
      now,
    ),
  ).toEqual(pdf);
});
it.each([1, 3])(
  "rejects adoption when saved revision is %s",
  async (revision) => {
    row.revision = revision;
    await expect(
      bindMemoryDocumentPreview(db, scope, 2, pdf, now),
    ).rejects.toThrow("DOCUMENT_PREVIEW_REVISION_CONFLICT");
    expect(update).not.toHaveBeenCalled();
  },
);
it("rejects deleted or foreign drafts", async () => {
  row.tripRequestId = "other";
  await expect(
    bindMemoryDocumentPreview(db, scope, 2, pdf, now),
  ).rejects.toThrow("DOCUMENT_PREVIEW_REVISION_CONFLICT");
  expect(update).not.toHaveBeenCalled();
});
it("rejects a deleted draft without adopting metadata", async () => {
  row = null as never;
  await expect(
    bindMemoryDocumentPreview(db, scope, 2, pdf, now),
  ).rejects.toThrow("DOCUMENT_PREVIEW_REVISION_CONFLICT");
  expect(update).not.toHaveBeenCalled();
});
it("rejects changed bytes, preview identities, revisions and legacy stored previews", async () => {
  const { previewId } = await bindMemoryDocumentPreview(db, scope, 2, pdf, now);
  for (const [patch, bytes, id] of [
    [{}, Buffer.from("%PDF-other bytes"), previewId],
    [{ revision: 3 }, pdf, previewId],
    [{ previewRevision: 1 }, pdf, previewId],
    [{ previewKey: "legacy/key" }, pdf, previewId],
    [{ tripRequestId: "other" }, pdf, previewId],
    [{}, pdf, createMemoryPreviewId(now)],
  ] as const)
    expect(() =>
      verifyMemoryDocumentPreview(
        { ...row, ...patch } as never,
        scope,
        2,
        id,
        bytes,
        now,
      ),
    ).toThrow("DOCUMENT_PUBLICATION_CONFLICT");
});
it("expires exactly after one hour; future and non-v7 identities are rejected", async () => {
  const { previewId } = await bindMemoryDocumentPreview(db, scope, 2, pdf, now);
  expect(
    verifyMemoryDocumentPreview(
      row as never,
      scope,
      2,
      previewId,
      pdf,
      now + 3599999,
    ),
  ).toEqual(pdf);
  for (const time of [now - 1, now + 3600000])
    expect(() =>
      verifyMemoryDocumentPreview(row as never, scope, 2, previewId, pdf, time),
    ).toThrow("DOCUMENT_MEMORY_PREVIEW_EXPIRED");
  const legacy = "12345678-1234-4234-8234-123456789012";
  expect(() =>
    verifyMemoryDocumentPreview(
      { ...row, previewId: legacy } as never,
      scope,
      2,
      legacy,
      pdf,
      now,
    ),
  ).toThrow("DOCUMENT_MEMORY_PREVIEW_EXPIRED");
});
it("enforces PDF and 4MiB limits before database access", async () => {
  for (const bytes of [
    Buffer.from("arbitrary"),
    Buffer.alloc(4 * 1024 * 1024 + 1),
  ])
    await expect(
      bindMemoryDocumentPreview(db, scope, 2, bytes, now),
    ).rejects.toThrow("INVALID_DOCUMENT_PDF");
  expect(withTripDocumentLocks).not.toHaveBeenCalled();
});
