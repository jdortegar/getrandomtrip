import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type {
  TripDocumentCandidateInput,
  TripDocumentCandidateRuntime,
} from "@/lib/types/TripDocumentCandidate";
import { withTripDocumentLocks } from "./tripDocumentLocks";

const safeSegment = (value: string | undefined) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  ![".", ".."].includes(value) &&
  !/[/\\]/.test(value);

function invalid(): never {
  throw new Error("INVALID_DOCUMENT_CANDIDATE");
}

/** Commit before PUT. No upsert: collisions fail without reusing mutable bytes.
 * Reserved document IDs do not imply an existing row; publication creates it later.
 * Callers authorize first. Adoption must use its caller's locked transaction.
 */
export async function registerDocumentCandidate(
  db: Pick<PrismaClient, "$transaction">,
  input: TripDocumentCandidateInput,
  runtime: TripDocumentCandidateRuntime = {},
) {
  const now = runtime.now ?? Date.now;
  const document = input.document && { ...input.document };
  const publication = input.purpose === "publication";
  const expiresAt = new Date(input.expiresAt.getTime());
  if (
    ![input.ownerId, input.tripRequestId, input.draftId].every(safeSegment) ||
    !Number.isSafeInteger(input.revision) ||
    input.revision < 1 ||
    input.revision > 2147483647 ||
    !Number.isFinite(expiresAt.getTime()) ||
    (publication
      ? !safeSegment(input.previewId) ||
        !safeSegment(document?.id) ||
        !["reserved", "existing"].includes(document?.state ?? "")
      : input.purpose !== "preview" ||
        document !== undefined ||
        input.previewId !== undefined)
  )
    invalid();
  const id = (runtime.randomId ?? randomUUID)();
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) invalid();
  const identity = {
    id,
    ownerId: input.ownerId,
    tripRequestId: input.tripRequestId,
    draftId: input.draftId,
    documentId: document?.id ?? null,
    previewId: publication ? input.previewId! : id,
    revision: input.revision,
    purpose: input.purpose,
  };
  const target = publication
    ? `documents/${identity.documentId}`
    : `drafts/${identity.draftId}`;
  const key = `generated/${identity.tripRequestId}/${target}/${id}`;
  if (Buffer.byteLength(key, "utf8") > 600) invalid();
  await withTripDocumentLocks(
    db,
    {
      ownerId: identity.ownerId,
      tripIds: [identity.tripRequestId],
      drafts: [{ id: identity.draftId, tripRequestId: identity.tripRequestId }],
      documents:
        document?.state === "existing"
          ? [{ id: document.id, tripRequestId: identity.tripRequestId }]
          : [],
    },
    (tx) => {
      const timestamp = now();
      if (!Number.isFinite(timestamp) || expiresAt.getTime() <= timestamp)
        invalid();
      return tx.tripDocumentCleanupJob.create({
        data: {
          ...identity,
          targets: { keys: [key], prefixes: [] },
          disposition: "pending",
          expiresAt,
        },
      });
    },
  );
  return Object.freeze({
    ...identity,
    key,
    expiresAt: expiresAt.toISOString(),
  });
}
