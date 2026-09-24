import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type {
  TripDocumentCandidateInput,
  TripDocumentCandidateRuntime,
} from "@/lib/types/TripDocumentCandidate";
import { registerDocumentCandidate } from "@/lib/db/tripDocumentCandidates";
import { getTripDocumentStore } from "./tripDocumentStore";

/** Server-only publication primitive; caller authorizes and renders first.
 * Each invocation reserves a fresh durable exact-key candidate before any PUT.
 * Never delete on failure: both DB commits and SDK writes may be ambiguous.
 * Retry via a new candidate; adoption/reconciliation is a separate transaction.
 */
export async function writeGeneratedDocument(
  db: Pick<PrismaClient, "$transaction">,
  input: TripDocumentCandidateInput,
  pdf: Uint8Array,
  runtime?: TripDocumentCandidateRuntime,
) {
  if (pdf.byteLength > 4 * 1024 * 1024)
    throw new Error("DOCUMENT_PDF_TOO_LARGE");
  const bytes = Uint8Array.from(pdf);
  if (Buffer.from(bytes.subarray(0, 4)).toString() !== "%PDF")
    throw new Error("INVALID_DOCUMENT_PDF");
  const size = bytes.byteLength;
  const hash = createHash("sha256").update(bytes).digest("hex");
  const receipt = await registerDocumentCandidate(db, input, runtime);
  const result = await getTripDocumentStore().set(receipt.key, bytes.buffer, {
    onlyIfNew: true,
    metadata: {
      contentType: "application/pdf",
      sha256: hash,
      size,
      candidateId: receipt.id,
      previewId: receipt.previewId,
      revision: receipt.revision,
      purpose: receipt.purpose,
    },
  });
  if (!result.modified) throw new Error("DOCUMENT_STORAGE_KEY_COLLISION");
  return { receipt, size, hash };
}
