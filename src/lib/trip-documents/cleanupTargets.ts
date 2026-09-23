import { createHash } from "node:crypto";
import type { TripDocumentCancellationScope } from "@/lib/types/TripDocumentCancellation";
import type {
  TripDocumentCleanupFacts,
  TripDocumentCleanupTarget,
} from "@/lib/types/TripDocumentCleanupTargets";

function invalid(): never {
  throw new Error("INVALID_DOCUMENT_CLEANUP_TARGET");
}
function segment(value: string) {
  if (
    typeof value !== "string" ||
    !value ||
    [".", ".."].includes(value) ||
    /[%?#\s/\\\u0000-\u001f\u007f]/u.test(value)
  )
    invalid();
}
const uuid = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

/** Server-only pure plan from trusted, complete DB snapshots: callers authorize,
 * verify them under ordered locks and persist before cascading. No live DB proof,
 * candidate cancellation, receipt mutation or storage I/O occurs here.
 */
export function planDocumentCleanup(
  scope: Readonly<TripDocumentCancellationScope>,
  facts: TripDocumentCleanupFacts,
): readonly TripDocumentCleanupTarget[] {
  segment(scope.ownerId);
  if (!["account", "trip", "draft", "document"].includes(scope.kind)) invalid();
  const trips = facts.trips.filter(
    (trip) => scope.kind === "account" || trip.id === scope.tripRequestId,
  );
  if (scope.kind !== "account" && !trips.length) invalid();
  const jobs = new Map<string, TripDocumentCleanupTarget>();
  const documents = new Map<string, string>();
  const keys = new Map<string, string>();
  function add(
    tripRequestId: string,
    draftId: string | null,
    documentId: string | null,
    target: string,
    prefix: boolean,
  ) {
    if (!target || Buffer.byteLength(target, "utf8") > 600) invalid();
    const purpose = prefix ? "scope-prefix" : "legacy-key";
    const identity = {
      ownerId: scope.ownerId,
      tripRequestId,
      draftId,
      documentId,
      purpose,
    } as const;
    const id = `cleanup-v1-${createHash("sha256")
      .update(JSON.stringify([identity, target]))
      .digest("hex")}`;
    jobs.set(
      id,
      Object.freeze({
        id,
        ...identity,
        disposition: "delete",
        previewId: null,
        revision: null,
        expiresAt: null,
        targets: Object.freeze({
          keys: Object.freeze(prefix ? [] : [target]),
          prefixes: Object.freeze(prefix ? [target] : []),
        }),
      }),
    );
  }
  for (const trip of trips) {
    segment(trip.id);
    if (trip.userId !== scope.ownerId) invalid();
    let prefix = `generated/${trip.id}/`;
    let draftId = null,
      documentId = null;
    if (scope.kind === "draft" || scope.kind === "document") {
      segment(scope.id);
      const children = (
        scope.kind === "draft" ? facts.drafts : facts.documents
      ).filter((child) => child.id === scope.id);
      if (
        !children.length ||
        children.some((child) => child.tripRequestId !== trip.id)
      )
        invalid();
      if (scope.kind === "draft") {
        draftId = scope.id;
        prefix += `drafts/${scope.id}/`;
      } else {
        documentId = scope.id;
        prefix += `documents/${scope.id}/`;
      }
    }
    add(trip.id, draftId, documentId, prefix, true);
    if (scope.kind === "draft") continue;
    for (const doc of facts.documents.filter(
      (doc) =>
        doc.tripRequestId === trip.id &&
        (scope.kind !== "document" || doc.id === scope.id),
    )) {
      segment(doc.id);
      const identity = JSON.stringify([doc.tripRequestId, doc.storageKey]);
      if (
        (documents.has(doc.id) && documents.get(doc.id) !== identity) ||
        (keys.has(doc.storageKey) && keys.get(doc.storageKey) !== doc.id)
      )
        invalid();
      documents.set(doc.id, identity);
      keys.set(doc.storageKey, doc.id);
      if (
        typeof doc.storageKey !== "string" ||
        Buffer.byteLength(doc.storageKey, "utf8") > 600
      )
        invalid();
      const legacy = `${trip.id}/`;
      const generated = `generated/${trip.id}/documents/${doc.id}/`;
      const root = doc.storageKey.startsWith(legacy) ? legacy : generated;
      if (
        !doc.storageKey.startsWith(root) ||
        !uuid.test(doc.storageKey.slice(root.length))
      )
        invalid();
      if (root === legacy) add(trip.id, null, doc.id, doc.storageKey, false);
    }
  }
  return Object.freeze(
    [...jobs.values()].sort((a, b) => a.id.localeCompare(b.id)),
  );
}
