// @vitest-environment node
import type { PrismaClient } from "@prisma/client";
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("../tripDocumentLocks", () => ({ withTripDocumentLocks: vi.fn() }));
vi.mock("../tripDocumentCleanupRegistration", () => ({
  registerDocumentCleanup: vi.fn(),
}));
import { withTripDocumentLocks } from "../tripDocumentLocks";
import { registerDocumentCleanup } from "../tripDocumentCleanupRegistration";
import { deletePublishedDocument } from "../deletePublishedDocument";
const db = {} as Pick<PrismaClient, "$transaction">;
const scope = {
  ownerId: "buyer",
  tripRequestId: "trip",
  documentId: "document",
};
const query = vi.fn();
const cancel = vi.fn();
const unlink = vi.fn();
const remove = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(withTripDocumentLocks).mockImplementation(
    async (_db, _scope, work) =>
      work({
        $queryRaw: query,
        tripDocumentCleanupJob: { updateMany: cancel },
        tripDocumentDraft: { updateMany: unlink },
        tripDocument: { delete: remove },
      } as never),
  );
  query
    .mockResolvedValueOnce([{ id: "draft", tripRequestId: "trip" }])
    .mockResolvedValueOnce([
      {
        id: "document",
        tripRequestId: "trip",
        storageKey: "trip/00000000-0000-4000-8000-000000000001",
      },
    ])
    .mockResolvedValueOnce([
      { id: "old", purpose: "publication" },
      { id: "pending", purpose: "publication" },
      { id: "preview", purpose: "preview" },
    ]);
  cancel.mockResolvedValue({ count: 3 });
  unlink.mockResolvedValue({ count: 1 });
});
it("cancels alldocumentgenerations andlinkedpreviews thenunlinkswithout deletingdraft", async () => {
  await deletePublishedDocument(db, scope);
  expect(query.mock.calls.map((call) => call[0].text)).toEqual([
    expect.stringContaining('FROM "trip_document_drafts"'),
    expect.stringContaining('FROM "trip_documents"'),
    expect.stringContaining('FROM "trip_document_cleanup_jobs"'),
  ]);
  expect(query.mock.calls[2][0].text).toContain('ORDER BY "id" FOR UPDATE');
  expect(cancel).toHaveBeenCalledWith({
    where: { id: { in: ["old", "pending", "preview"] } },
    data: { disposition: "delete", nextAttemptAt: expect.any(Date) },
  });
  expect(unlink).toHaveBeenCalledWith({
    where: { documentId: "document", tripRequestId: "trip" },
    data: {
      documentId: null,
      publishedRevision: null,
      publishedPreviewId: null,
      previewId: null,
      previewKey: null,
      previewRevision: null,
      previewSize: null,
      previewHash: null,
    },
  });
  expect(remove).toHaveBeenCalledWith({ where: { id: "document" } });
  expect(registerDocumentCleanup).toHaveBeenCalledWith(
    expect.anything(),
    {
      kind: "document",
      ownerId: "buyer",
      tripRequestId: "trip",
      id: "document",
    },
    expect.anything(),
    expect.any(Function),
    { exactKeysOnly: true },
  );
});
it("aborts before deletion ifdurableintent registration fails", async () => {
  vi.mocked(registerDocumentCleanup).mockRejectedValue(
    new Error("outbox unavailable"),
  );
  await expect(deletePublishedDocument(db, scope)).rejects.toThrow(
    "outbox unavailable",
  );
  expect(remove).not.toHaveBeenCalled();
  expect(unlink).not.toHaveBeenCalled();
});
it("failsclosed on cross-tripdocument", async () => {
  query
    .mockReset()
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ id: "document", tripRequestId: "other" }]);
  await expect(deletePublishedDocument(db, scope)).rejects.toThrow(
    "DOCUMENT_LOCK_SCOPE_MISMATCH",
  );
  expect(cancel).not.toHaveBeenCalled();
});
