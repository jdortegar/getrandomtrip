import { isDeepStrictEqual } from "node:util";
import type {
  TripDocumentCleanupExecutionJob,
  TripDocumentCleanupRuntime,
} from "@/lib/types/TripDocumentCleanupExecution";
import { planDocumentCleanup } from "./cleanupTargets";

const uuid = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const segment = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  ![".", ".."].includes(value) &&
  !/[%?#\s/\\\u0000-\u001f\u007f]/u.test(value);
function invalid(): never {
  throw new Error("INVALID_DOCUMENT_CLEANUP_JOB");
}
function exactKey(job: TripDocumentCleanupExecutionJob) {
  if (!segment(job.ownerId) || !segment(job.tripRequestId)) invalid();
  let key: string;
  if (job.purpose === "legacy-key") {
    if (
      !segment(job.documentId) ||
      job.draftId !== null ||
      job.previewId !== null ||
      job.revision !== null
    )
      invalid();
    const targets = job.targets as { keys?: unknown[] } | null;
    if (
      !targets ||
      !Array.isArray(targets.keys) ||
      typeof targets.keys[0] !== "string"
    )
      invalid();
    key = targets.keys[0];
    try {
      const plan = planDocumentCleanup(
        {
          kind: "document",
          ownerId: job.ownerId,
          tripRequestId: job.tripRequestId,
          id: job.documentId,
        },
        {
          trips: [{ id: job.tripRequestId, userId: job.ownerId }],
          drafts: [],
          documents: [
            {
              id: job.documentId,
              tripRequestId: job.tripRequestId,
              storageKey: key,
            },
          ],
        },
      );
      if (
        !plan.some(
          (entry) => entry.purpose === "legacy-key" && entry.id === job.id,
        )
      )
        invalid();
    } catch {
      invalid();
    }
  } else {
    if (
      !uuid.test(job.id) ||
      !segment(job.draftId) ||
      !Number.isInteger(job.revision) ||
      job.revision! < 1 ||
      job.revision! > 2147483647
    )
      invalid();
    if (job.purpose === "preview") {
      if (job.previewId !== job.id || job.documentId !== null) invalid();
      key = `generated/${job.tripRequestId}/drafts/${job.draftId}/${job.id}`;
    } else if (job.purpose === "publication") {
      if (!segment(job.documentId) || !segment(job.previewId)) invalid();
      key = `generated/${job.tripRequestId}/documents/${job.documentId}/${job.id}`;
    } else invalid();
  }
  if (
    Buffer.byteLength(key, "utf8") > 600 ||
    !isDeepStrictEqual(job.targets, { keys: [key], prefixes: [] })
  )
    invalid();
  return key;
}

/** Parent-independent storage I/O against terminal delete dispositions only.
 * Retain tombstones after success/absence: late SDK PUT retries need later sweeps.
 * The worker owns recurring scheduling/backoff; propagate read/storage failures.
 */
export async function sweepExactDocumentKey(
  id: string,
  runtime: TripDocumentCleanupRuntime,
) {
  const job = await runtime.findJob(id);
  if (!job) return "skipped" as const;
  if (job.id !== id) invalid();
  if (["pending", "retained"].includes(job.disposition))
    return "skipped" as const;
  if (job.disposition !== "delete") invalid();
  const key = exactKey(job);
  await runtime.deleteKey(key);
  return "swept" as const;
}
