// @vitest-environment node
import type { PrismaClient } from "@prisma/client";
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/db/tripDocumentLocks", () => ({
  withTripDocumentLocks: vi.fn(),
}));
vi.mock("@/lib/storage/readDocumentPreview", () => ({
  readDocumentPreview: vi.fn(),
}));
vi.mock("@/lib/storage/writeGeneratedDocument", () => ({
  writeGeneratedDocument: vi.fn(),
}));
vi.mock("@/lib/db/publishDocumentDraft", () => ({
  publishDocumentDraft: vi.fn(),
}));
import { withTripDocumentLocks } from "@/lib/db/tripDocumentLocks";
import { readDocumentPreview } from "@/lib/storage/readDocumentPreview";
import { writeGeneratedDocument } from "@/lib/storage/writeGeneratedDocument";
import { publishDocumentDraft } from "@/lib/db/publishDocumentDraft";
import { attachDocumentDraft } from "../attachDocumentDraft";
const db = {} as Pick<PrismaClient, "$transaction">;
const requestId = "00000000-0000-4000-8000-000000000001";
const previewId = "00000000-0000-4000-8000-000000000002";
const input = {
  ownerId: "buyer",
  tripRequestId: "trip",
  draftId: "draft",
  adminId: "admin",
  revision: 2,
  previewId,
  requestId,
};
const receipt = {
  id: requestId,
  ownerId: "buyer",
  tripRequestId: "trip",
  draftId: "draft",
  documentId: "document",
  purpose: "publication" as const,
  revision: 2,
  previewId,
  key: `generated/trip/documents/document/${requestId}`,
  expiresAt: "2030-01-01T00:00:00.000Z",
};
const draftFind = vi.fn();
const jobFind = vi.fn();
const bytes = Buffer.from("%PDF");
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(withTripDocumentLocks).mockImplementation(
    async (_db, _scope, work) =>
      work({
        tripDocumentDraft: { findUnique: draftFind },
        tripDocumentCleanupJob: { findUnique: jobFind },
        $queryRaw: async () => [{ id: "document", tripRequestId: "trip" }],
      } as never),
  );
  draftFind.mockResolvedValue({
    id: "draft",
    tripRequestId: "trip",
    revision: 2,
    previewRevision: 2,
    previewId,
    documentId: null,
  });
  jobFind.mockResolvedValue(null);
  vi.mocked(readDocumentPreview).mockResolvedValue(bytes);
  vi.mocked(writeGeneratedDocument).mockResolvedValue({
    receipt,
    size: 4,
    hash: "a".repeat(64),
  });
  vi.mocked(publishDocumentDraft).mockResolvedValue({
    documentId: "document",
    status: "adopted",
  });
});
it("copies verified bytes without rendering and registers stable request identity", async () => {
  expect(await attachDocumentDraft(db, input)).toEqual({
    documentId: "document",
    status: "adopted",
  });
  expect(vi.mocked(writeGeneratedDocument).mock.calls[0][2]).toBe(bytes);
  expect(vi.mocked(writeGeneratedDocument).mock.calls[0][3]?.randomId?.()).toBe(
    requestId,
  );
  expect(publishDocumentDraft).toHaveBeenCalledWith(db, {
    receipt,
    size: 4,
    hash: "a".repeat(64),
    adminId: "admin",
  });
});
it("requires explicit matching replacement and passes stable document ID", async () => {
  draftFind.mockResolvedValue({
    revision: 2,
    previewRevision: 2,
    previewId,
    tripRequestId: "trip",
    documentId: "document",
  });
  await expect(attachDocumentDraft(db, input)).rejects.toThrow(
    "DOCUMENT_REPLACEMENT_REQUIRED",
  );
  await attachDocumentDraft(db, { ...input, replaceDocumentId: "document" });
  expect(writeGeneratedDocument).toHaveBeenCalledWith(
    db,
    expect.objectContaining({
      document: { id: "document", state: "existing" },
    }),
    bytes,
    expect.any(Object),
  );
});
it("recognizes retained matching receipt before stale draft checks", async () => {
  draftFind.mockResolvedValue({
    revision: 9,
    tripRequestId: "trip",
    documentId: "document",
  });
  jobFind.mockResolvedValue({
    ...receipt,
    disposition: "retained",
    expiresAt: new Date(receipt.expiresAt),
    targets: { keys: [receipt.key], prefixes: [] },
  });
  vi.mocked(publishDocumentDraft).mockResolvedValue({
    documentId: "document",
    status: "retained",
  });
  expect(await attachDocumentDraft(db, input)).toEqual({
    documentId: "document",
    status: "retained",
  });
  expect(readDocumentPreview).not.toHaveBeenCalled();
  expect(writeGeneratedDocument).not.toHaveBeenCalled();
});
it.each(["pending", "delete"])(
  "never retries PUT for existing %s receipt",
  async (disposition) => {
    jobFind.mockResolvedValue({
      ...receipt,
      disposition,
      expiresAt: new Date(receipt.expiresAt),
      targets: { keys: [receipt.key], prefixes: [] },
    });
    await expect(attachDocumentDraft(db, input)).rejects.toThrow(
      disposition === "delete"
        ? "DOCUMENT_ATTACH_REQUEST_EXPIRED"
        : "DOCUMENT_ATTACH_RETRY_UNAVAILABLE",
    );
    expect(writeGeneratedDocument).not.toHaveBeenCalled();
  },
);
it("rejects identity reuse and stale preview before storage", async () => {
  jobFind.mockResolvedValue({
    ...receipt,
    ownerId: "other",
    disposition: "retained",
  });
  await expect(attachDocumentDraft(db, input)).rejects.toThrow(
    "DOCUMENT_ATTACH_REQUEST_MISMATCH",
  );
  jobFind.mockResolvedValue(null);
  draftFind.mockResolvedValue({ revision: 3, tripRequestId: "trip" });
  await expect(attachDocumentDraft(db, input)).rejects.toThrow(
    "DOCUMENT_PUBLICATION_CONFLICT",
  );
  expect(readDocumentPreview).not.toHaveBeenCalled();
});
it("does not publish after unreadable preview or ambiguous PUT", async () => {
  vi.mocked(readDocumentPreview).mockRejectedValueOnce(new Error("corrupt"));
  await expect(attachDocumentDraft(db, input)).rejects.toThrow("corrupt");
  expect(writeGeneratedDocument).not.toHaveBeenCalled();
  vi.mocked(writeGeneratedDocument).mockRejectedValue(new Error("timeout"));
  await expect(attachDocumentDraft(db, input)).rejects.toThrow("timeout");
  expect(publishDocumentDraft).not.toHaveBeenCalled();
});

it("allows a fresh explicit request after an abandoned candidate expires", async () => {
  jobFind.mockResolvedValue({
    ...receipt,
    disposition: "pending",
    expiresAt: new Date(0),
  });
  await expect(attachDocumentDraft(db, input)).rejects.toThrow(
    "DOCUMENT_ATTACH_REQUEST_EXPIRED",
  );
  jobFind.mockResolvedValue(null);
  await attachDocumentDraft(db, {
    ...input,
    requestId: "00000000-0000-4000-8000-000000000009",
  });
  expect(writeGeneratedDocument).toHaveBeenCalledOnce();
});
