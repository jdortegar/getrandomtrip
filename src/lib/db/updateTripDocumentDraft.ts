import type { Prisma, PrismaClient } from "@prisma/client";
import {
  parseDraftPatch,
  toDraftDto,
} from "@/lib/trip-documents/draftContracts";
import { withTripDocumentLocks } from "./tripDocumentLocks";

interface DraftScope {
  ownerId: string;
  tripRequestId: string;
  draftId: string;
}

/** Require live admin authorization before calling. Existing immutable candidate
 * receipts remain durable; clearing preview pointers never deletes storage.
 * No source snapshot refresh or published-document mutation occurs on save.
 */
export async function updateTripDocumentDraft(
  db: Pick<PrismaClient, "$transaction">,
  scope: DraftScope,
  input: unknown,
) {
  const parsed = parseDraftPatch(input);
  if (!parsed.ok) return parsed;
  const { revision, document } = parsed.value;
  return withTripDocumentLocks(
    db,
    {
      ownerId: scope.ownerId,
      tripIds: [scope.tripRequestId],
      drafts: [{ id: scope.draftId, tripRequestId: scope.tripRequestId }],
    },
    async (tx) => {
      const row = await tx.tripDocumentDraft.findUnique({
        where: { id: scope.draftId },
      });
      if (!row || row.tripRequestId !== scope.tripRequestId)
        return { ok: false as const, error: "draft_not_found" as const };
      if (row.revision !== revision)
        return { ok: false as const, error: "revision_conflict" as const };
      if (
        row.template !== document.template ||
        row.templateVersion !== document.templateVersion
      )
        return { ok: false as const, error: "immutable_template" as const };
      if (revision >= 2147483647)
        return { ok: false as const, error: "revision_conflict" as const };
      const updated = await tx.tripDocumentDraft.update({
        where: { id: row.id },
        data: {
          label: document.label,
          country: document.country,
          locale: document.locale,
          data: document.data as unknown as Prisma.InputJsonValue,
          revision: revision + 1,
          previewId: null,
          previewKey: null,
          previewRevision: null,
          previewSize: null,
          previewHash: null,
        },
      });
      return { ok: true as const, value: toDraftDto(updated) };
    },
  );
}
