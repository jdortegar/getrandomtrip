import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { withTripDocumentLocks } from "@/lib/db/tripDocumentLocks";
import { getTripDocumentStore } from "./tripDocumentStore";
interface Scope {
  ownerId: string;
  tripRequestId: string;
  draftId: string;
}
/** Admin-only caller; supplied identity selects a current preview, never a URL.
 * Blob I/O is outside locks; recheck current identity before releasing bytes.
 */
export async function readDocumentPreview(
  db: Pick<PrismaClient, "$transaction">,
  scope: Scope,
  revision: number,
  previewId: string,
) {
  const safe = (value: string) =>
    !!value &&
    !/[\s%?#/\\\u0000-\u001f\u007f]/u.test(value) &&
    value !== "." &&
    value !== "..";
  if (
    !Number.isSafeInteger(revision) ||
    revision < 1 ||
    !Object.values(scope).every(safe) ||
    !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(previewId)
  )
    throw new Error("DOCUMENT_PREVIEW_CONFLICT");
  const key = `generated/${scope.tripRequestId}/drafts/${scope.draftId}/${previewId}`;
  if (Buffer.byteLength(key) > 600)
    throw new Error("DOCUMENT_PREVIEW_CONFLICT");
  const locks = {
    ownerId: scope.ownerId,
    tripIds: [scope.tripRequestId],
    drafts: [{ id: scope.draftId, tripRequestId: scope.tripRequestId }],
  };
  const read = () =>
    withTripDocumentLocks(db, locks, async (tx) => {
      const row = await tx.tripDocumentDraft.findUnique({
        where: { id: scope.draftId },
      });
      if (
        !row ||
        row.tripRequestId !== scope.tripRequestId ||
        row.revision !== revision ||
        row.previewRevision !== revision ||
        row.previewId !== previewId ||
        row.previewKey !== key ||
        !Number.isSafeInteger(row.previewSize) ||
        row.previewSize! < 1 ||
        row.previewSize! > 4 * 1024 * 1024 ||
        !/^[a-f0-9]{64}$/.test(row.previewHash ?? "")
      )
        throw new Error("DOCUMENT_PREVIEW_CONFLICT");
      return { size: row.previewSize!, hash: row.previewHash! };
    });
  const expected = await read();
  const stream = await getTripDocumentStore().get(key, { type: "stream" });
  if (!stream) throw new Error("DOCUMENT_PREVIEW_UNAVAILABLE");
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      size += item.value.byteLength;
      if (size > expected.size) {
        await reader.cancel().catch(() => undefined);
        throw new Error("DOCUMENT_PREVIEW_INTEGRITY");
      }
      chunks.push(item.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = Buffer.concat(chunks, size);
  if (
    size !== expected.size ||
    createHash("sha256").update(bytes).digest("hex") !== expected.hash
  )
    throw new Error("DOCUMENT_PREVIEW_INTEGRITY");
  const current = await read();
  if (current.size !== expected.size || current.hash !== expected.hash)
    throw new Error("DOCUMENT_PREVIEW_CONFLICT");
  return bytes;
}
