import { Prisma, type PrismaClient } from "@prisma/client";
import { withTripDocumentLocks } from "@/lib/db/tripDocumentLocks";
import { adoptDocumentPreview } from "@/lib/db/adoptDocumentPreview";
import { writeGeneratedDocument } from "@/lib/storage/writeGeneratedDocument";
import { parseDraftDocument } from "./draftContracts";
import { renderHotelVoucher } from "./pdf/renderHotelVoucher";
import { renderActivityVoucher } from "./pdf/renderActivityVoucher";
import { renderDinnerVoucher } from "./pdf/renderDinnerVoucher";
import { renderExperienceRoadmap } from "./pdf/renderExperienceRoadmap";
import { renderXsedRoadmap } from "./pdf/renderXsedRoadmap";
interface Scope {
  ownerId: string;
  tripRequestId: string;
  draftId: string;
}
/** Caller authorizes admin. Rendering/storage occur outside DB transactions.
 * Every invocation uses a fresh candidate. Current preview GET must still verify
 * revision/preview identity: returned retained adoption may since be superseded.
 */
export async function renderSavedDocumentDraft(
  db: Pick<PrismaClient, "$transaction">,
  scope: Scope,
  revision: number,
) {
  if (!Number.isSafeInteger(revision) || revision < 1)
    throw new Error("INVALID_DOCUMENT_REVISION");
  const locks = {
    ownerId: scope.ownerId,
    tripIds: [scope.tripRequestId],
    drafts: [{ id: scope.draftId, tripRequestId: scope.tripRequestId }],
  };
  const document = await withTripDocumentLocks(db, locks, async (tx) => {
    const row = await tx.tripDocumentDraft.findUnique({
      where: { id: scope.draftId },
    });
    if (
      !row ||
      row.tripRequestId !== scope.tripRequestId ||
      row.revision !== revision
    )
      throw new Error("DOCUMENT_PREVIEW_REVISION_CONFLICT");
    const parsed = parseDraftDocument({
      template: row.template,
      templateVersion: row.templateVersion,
      label: row.label,
      country: row.country,
      locale: row.locale,
      data: row.data,
    });
    if (!parsed.ok) throw new Error("INVALID_STORED_DOCUMENT_DRAFT");
    return parsed.value;
  });
  const renderers = {
    "hotel-voucher": renderHotelVoucher,
    "activity-voucher": renderActivityVoucher,
    "dinner-voucher": renderDinnerVoucher,
    "experience-roadmap": renderExperienceRoadmap,
    "xsed-roadmap": renderXsedRoadmap,
  };
  const rendered = await renderers[document.template](document);
  if (!rendered.ok) return rendered;
  const stored = await writeGeneratedDocument(
    db,
    {
      ...scope,
      revision,
      purpose: "preview",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
    rendered.buffer,
  );
  await adoptDocumentPreview(db, stored.receipt, {
    size: stored.size,
    hash: stored.hash,
  });
  await withTripDocumentLocks(db, locks, async (tx) => {
    const current = await tx.tripDocumentDraft.findUnique({
      where: { id: scope.draftId },
    });
    if (!current || current.tripRequestId !== scope.tripRequestId)
      throw new Error("DOCUMENT_LOCK_SCOPE_MISMATCH");
    // Lock obsolete preview receipts in one sorted batch; publication generations
    // and pending concurrent renders are excluded. No ancestor locks afterward.
    const old = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
   SELECT "id" FROM "trip_document_cleanup_jobs"
   WHERE "ownerId"=${scope.ownerId} AND "tripRequestId"=${scope.tripRequestId}
   AND "draftId"=${scope.draftId} AND "purpose"='preview' AND "disposition"='retained'
   AND "previewId" IS DISTINCT FROM ${current.previewId}
   ORDER BY "id" FOR UPDATE`);
    if (old.length)
      await tx.tripDocumentCleanupJob.updateMany({
        where: {
          id: { in: old.map((row) => row.id) },
          purpose: "preview",
          disposition: "retained",
        },
        data: { disposition: "delete", nextAttemptAt: new Date() },
      });
  });
  return { ok: true as const, previewId: stored.receipt.previewId, revision };
}
