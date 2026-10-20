"use client";

import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableQueryBoundary } from "@/components/ui/TableQueryBoundary";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { useHasLoadedOnce } from "@/hooks/useHasLoadedOnce";
import type { SegmentSummary } from "@/types/emailCampaign";
import { fillTemplate } from "./campaignApi";
import { EmailCampaignsSectionHeader } from "./EmailCampaignsSectionHeader";
import { EmailCampaignsSubnav } from "./EmailCampaignsSubnav";
import { readApiErrorCode, SEGMENTS_API } from "./segmentApi";
import { SegmentFormModal } from "./SegmentFormModal";
import { SegmentsTable } from "./SegmentsTable";
import { useSegments } from "./useSegments";

const CTA_CLASS =
  "h-11 rounded-sm border-2 border-primary bg-primary px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-primary-800";

/** The segment form is closed (`null`), creating (`"new"`) or editing a segment. */
type FormTarget = SegmentSummary | "new" | null;

/** Admin segments: list with member counts, create, rename / describe and delete. */
export function SegmentsPageClient() {
  const pageCopy = useDictionary((d) => d.adminPages.emailCampaigns);
  const queryCopy = useDictionary((d) => d.common.tableFilters);
  const locale = useLocale();
  const copy = pageCopy.segments;

  const { reload, segments, status } = useSegments();
  const loading = status === "loading";
  const hasLoadedOnce = useHasLoadedOnce(loading);
  const [formTarget, setFormTarget] = useState<FormTarget>(null);
  const [deleteTarget, setDeleteTarget] = useState<SegmentSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteInFlight = useRef(false);
  const [notice, setNotice] = useState<string | null>(null);

  function openForm(target: Exclude<FormTarget, null>) {
    setNotice(null);
    setFormTarget(target);
  }

  function handleSaved() {
    setNotice(formTarget === "new" ? copy.feedback.created : copy.feedback.saved);
    setFormTarget(null);
    reload();
  }

  function openDelete(segment: SegmentSummary) {
    setNotice(null);
    setDeleteError(null);
    setDeleteTarget(segment);
  }

  function closeDelete() {
    if (deleteInFlight.current) return;
    setDeleteTarget(null);
    setDeleteError(null);
  }

  function deleteFailure(statusCode: number, code: string | null): string {
    if (code === "segment_in_use") return copy.delete.errors.inUse;
    if (code === "system_segment") return copy.delete.errors.system;
    if (statusCode === 404) return copy.delete.errors.notFound;
    return copy.delete.errors.generic;
  }

  async function confirmDelete() {
    const target = deleteTarget;
    if (!target || deleteInFlight.current) return;
    deleteInFlight.current = true;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${SEGMENTS_API}/${target.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        setNotice(copy.feedback.deleted);
        reload();
        return;
      }
      setDeleteError(deleteFailure(res.status, await readApiErrorCode(res)));
    } catch {
      setDeleteError(copy.delete.errors.generic);
    } finally {
      deleteInFlight.current = false;
      setDeleting(false);
    }
  }

  const newSegmentCta = (
    <Button className={CTA_CLASS} onClick={() => openForm("new")} type="button">
      <Plus aria-hidden className="h-4 w-4" />
      {copy.newSegment}
    </Button>
  );

  return (
    <div className="space-y-10">
      <EmailCampaignsSubnav active="segments" copy={pageCopy.tabs} locale={locale} />
      <EmailCampaignsSectionHeader
        action={newSegmentCta}
        eyebrow={copy.eyebrow}
        heading={copy.heading}
      />

      {notice && (
        <p className="text-sm text-green-700" role="status">
          {notice}
        </p>
      )}

      {loading && !hasLoadedOnce ? (
        <LoadingSpinner />
      ) : (
        <TableQueryBoundary
          copy={queryCopy}
          error={status === "error" ? copy.errorLoad : null}
          isLoading={loading}
          onRetry={() => {
            if (!loading) reload();
          }}
        >
          {segments.length === 0 ? (
            status === "ready" && (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
                <h3 className="text-xl font-semibold text-ink">{copy.empty.title}</h3>
                <p className="max-w-md text-sm text-neutral-700">{copy.empty.body}</p>
                {newSegmentCta}
              </div>
            )
          ) : (
            <SegmentsTable
              copy={copy}
              onDelete={openDelete}
              onEdit={openForm}
              segments={segments}
            />
          )}
        </TableQueryBoundary>
      )}

      {formTarget && (
        <SegmentFormModal
          copy={copy.form}
          key={formTarget === "new" ? "new" : formTarget.id}
          onClose={() => setFormTarget(null)}
          onSaved={handleSaved}
          segment={formTarget === "new" ? undefined : formTarget}
        />
      )}

      <ConfirmModal
        cancelLabel={copy.delete.cancel}
        confirmLabel={copy.delete.confirm}
        confirmingLabel={copy.delete.deleting}
        description={
          <>
            {fillTemplate(copy.delete.body, { name: deleteTarget?.name ?? "" })}
            {deleteError && (
              <span className="mt-3 block text-sm text-red-700" role="alert">
                {deleteError}
              </span>
            )}
          </>
        }
        icon={Trash2}
        isConfirming={deleting}
        onConfirm={() => void confirmDelete()}
        onOpenChange={(open) => {
          if (!open) closeDelete();
        }}
        open={deleteTarget !== null}
        title={copy.delete.title}
        tone="danger"
      />
    </div>
  );
}
