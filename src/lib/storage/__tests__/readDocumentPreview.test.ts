// @vitest-environment node
import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/db/tripDocumentLocks", () => ({
  withTripDocumentLocks: vi.fn(),
}));
vi.mock("../tripDocumentStore", () => ({ getTripDocumentStore: vi.fn() }));
import { withTripDocumentLocks } from "@/lib/db/tripDocumentLocks";
import { getTripDocumentStore } from "../tripDocumentStore";
import { readDocumentPreview } from "../readDocumentPreview";
const db = {} as Pick<PrismaClient, "$transaction">;
const scope = { ownerId: "buyer", tripRequestId: "trip", draftId: "draft" };
const previewId = "00000000-0000-4000-8000-000000000001";
const bytes = Buffer.from("%PDF-private");
const row = {
  id: "draft",
  tripRequestId: "trip",
  revision: 2,
  previewRevision: 2,
  previewId,
  previewKey: `generated/trip/drafts/draft/${previewId}`,
  previewSize: bytes.length,
  previewHash: createHash("sha256").update(bytes).digest("hex"),
};
const findUnique = vi.fn();
const get = vi.fn();
const stream = (value: Uint8Array) =>
  new ReadableStream({
    start(controller) {
      controller.enqueue(value);
      controller.close();
    },
  });
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(withTripDocumentLocks).mockImplementation(
    async (_db, _scope, work) =>
      work({ tripDocumentDraft: { findUnique } } as never),
  );
  findUnique.mockResolvedValue(row);
  vi.mocked(getTripDocumentStore).mockReturnValue({ get } as never);
  get.mockResolvedValue(stream(bytes));
});
it("reads only server key and verifies bytes before second locked identity check", async () => {
  expect(await readDocumentPreview(db, scope, 2, previewId)).toEqual(bytes);
  expect(get).toHaveBeenCalledWith(row.previewKey, { type: "stream" });
  expect(findUnique).toHaveBeenCalledTimes(2);
});
it.each([
  { revision: 3 },
  { previewRevision: 1 },
  { previewId: "other" },
  { previewKey: "https://attacker" },
  { previewSize: 4 * 1024 * 1024 + 1 },
])("rejects stale/unsafe stored pointers before storage", async (patch) => {
  findUnique.mockResolvedValue({ ...row, ...patch });
  await expect(readDocumentPreview(db, scope, 2, previewId)).rejects.toThrow();
  expect(get).not.toHaveBeenCalled();
});
it("rejects changed current identity after fetching", async () => {
  findUnique
    .mockResolvedValueOnce(row)
    .mockResolvedValueOnce({ ...row, revision: 3 });
  await expect(readDocumentPreview(db, scope, 2, previewId)).rejects.toThrow(
    "DOCUMENT_PREVIEW_CONFLICT",
  );
});
it.each([Buffer.from("wrong"), Buffer.from("%PDF-corrupt")])(
  "rejects size/hash corruption",
  async (value) => {
    get.mockResolvedValue(stream(value));
    await expect(readDocumentPreview(db, scope, 2, previewId)).rejects.toThrow(
      "DOCUMENT_PREVIEW_INTEGRITY",
    );
  },
);
it("cancels oversize streamed data and never returns partialbytes", async () => {
  const cancel = vi.fn();
  get.mockResolvedValue(
    new ReadableStream({
      pull(controller) {
        controller.enqueue(new Uint8Array(bytes.length + 1));
      },
      cancel,
    }),
  );
  await expect(readDocumentPreview(db, scope, 2, previewId)).rejects.toThrow(
    "DOCUMENT_PREVIEW_INTEGRITY",
  );
  expect(cancel).toHaveBeenCalled();
});
it("treats absent bytes as unavailable without rerender", async () => {
  get.mockResolvedValue(null);
  await expect(readDocumentPreview(db, scope, 2, previewId)).rejects.toThrow(
    "DOCUMENT_PREVIEW_UNAVAILABLE",
  );
});
