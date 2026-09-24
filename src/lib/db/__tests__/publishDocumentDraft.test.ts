// @vitest-environment node
import type { PrismaClient } from "@prisma/client";
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("../tripDocumentLocks", () => ({ withTripDocumentLocks: vi.fn() }));
vi.mock("../tripDocumentCandidateLifecycle", () => ({
  retainDocumentCandidate: vi.fn(),
  reconcileDocumentCandidate: vi.fn(),
}));
import { withTripDocumentLocks } from "../tripDocumentLocks";
import {
  retainDocumentCandidate,
  reconcileDocumentCandidate,
} from "../tripDocumentCandidateLifecycle";
import { publishDocumentDraft } from "../publishDocumentDraft";
const db = {} as Pick<PrismaClient, "$transaction">;
const receipt = {
  id: "candidate",
  ownerId: "buyer",
  tripRequestId: "trip",
  draftId: "draft",
  documentId: "document",
  previewId: "preview",
  revision: 2,
  purpose: "publication" as const,
  key: "generated/trip/documents/document/candidate",
  expiresAt: "2030-01-01",
};
const input = { receipt, size: 4, hash: "a".repeat(64), adminId: "admin" };
const draft = {
  id: "draft",
  tripRequestId: "trip",
  revision: 2,
  previewRevision: 2,
  previewId: "preview",
  previewSize: 4,
  previewHash: input.hash,
  label: "Voucher",
  locale: "en",
  country: "AR",
  documentId: null,
};
const findUnique = vi.fn();
const query = vi.fn();
const create = vi.fn();
const update = vi.fn();
const events: string[] = [];
beforeEach(() => {
  vi.resetAllMocks();
  events.length = 0;
  findUnique.mockResolvedValue(draft);
  query.mockResolvedValue([]);
  create.mockResolvedValue({ id: "document" });
  update.mockResolvedValue({});
  vi.mocked(withTripDocumentLocks).mockImplementation(
    async (_db, _scope, work) => {
      events.push("owner-trip-draft");
      return work({
        tripDocumentDraft: { findUnique, update },
        tripDocument: { create },
        $queryRaw: query,
      } as never);
    },
  );
  vi.mocked(reconcileDocumentCandidate).mockImplementation(async () => {
    events.push("receipt");
    return "pending";
  });
  vi.mocked(retainDocumentCandidate).mockImplementation(
    async (tx, _receipt, adopt) => {
      await adopt(tx);
      return "adopted";
    },
  );
});
it("creates published row and links markers atomically without email/trip writes", async () => {
  expect(await publishDocumentDraft(db, input)).toEqual({
    documentId: "document",
    status: "adopted",
  });
  expect(create).toHaveBeenCalledWith({
    data: {
      id: "document",
      tripRequestId: "trip",
      label: "Voucher",
      country: "AR",
      storageKey: receipt.key,
      mimeType: "application/pdf",
      originalFilename: "document.pdf",
      sizeBytes: 4,
      uploadedById: "admin",
    },
  });
  expect(update).toHaveBeenCalledWith({
    where: { id: "draft" },
    data: {
      documentId: "document",
      publishedRevision: 2,
      publishedPreviewId: "preview",
    },
  });
  expect(query.mock.invocationCallOrder[0]).toBeLessThan(
    vi.mocked(reconcileDocumentCandidate).mock.invocationCallOrder[0],
  );
});
it("recognizes retained publication before stale revision only while link survives", async () => {
  vi.mocked(reconcileDocumentCandidate).mockResolvedValue("retained");
  findUnique.mockResolvedValue({
    ...draft,
    revision: 3,
    documentId: "document",
  });
  query.mockResolvedValue([{ id: "document", tripRequestId: "trip" }]);
  expect(await publishDocumentDraft(db, input)).toEqual({
    documentId: "document",
    status: "retained",
  });
  expect(create).not.toHaveBeenCalled();
  query.mockResolvedValue([]);
  await expect(publishDocumentDraft(db, input)).rejects.toThrow(
    "DOCUMENT_PUBLICATION_LINK_MISSING",
  );
});
it.each([
  { revision: 3 },
  { previewId: "new" },
  { previewHash: "b".repeat(64) },
  { previewSize: 5 },
  { documentId: "existing" },
])(
  "rejects stale identity or replacement without explicit support",
  async (patch) => {
    findUnique.mockResolvedValue({ ...draft, ...patch });
    await expect(publishDocumentDraft(db, input)).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  },
);
it("does not treat failed transaction as success when receipt remains pending", async () => {
  create.mockRejectedValue(new Error("rollback"));
  await expect(publishDocumentDraft(db, input)).rejects.toThrow("rollback");
  expect(update).not.toHaveBeenCalled();
});
it("reconciles ambiguous commit using retained receipt and surviving link", async () => {
  const normal = vi.mocked(withTripDocumentLocks).getMockImplementation()!;
  let first = true;
  vi.mocked(withTripDocumentLocks).mockImplementation(async (...args) => {
    const result = await normal(...args);
    if (first) {
      first = false;
      vi.mocked(reconcileDocumentCandidate).mockResolvedValue("retained");
      findUnique.mockResolvedValue({ ...draft, documentId: "document" });
      query.mockResolvedValue([{ id: "document", tripRequestId: "trip" }]);
      throw new Error("lost commit");
    }
    return result;
  });
  expect(await publishDocumentDraft(db, input)).toEqual({
    documentId: "document",
    status: "retained",
  });
});
