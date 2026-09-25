"use client";
import { useDocumentStageScroll } from "./useDocumentStageScroll";
import { useState } from "react";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { useSaveDocumentPreview } from "./useSaveDocumentPreview";
import { DocumentDraftFeedback } from "./DocumentDraftFeedback";
import { DocumentDraftList } from "./DocumentDraftList";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentServerValidationContext } from "./DocumentServerValidationContext";
import { DocumentDraftEditor } from "./DocumentDraftEditor";
import { DocumentDraftReview } from "./DocumentDraftReview";
import { DocumentDraftCreation } from "./DocumentDraftCreation";
import { DocumentActionButton } from "./DocumentActionButton";
import { DocumentDraftActions } from "./DocumentDraftActions";
import { useDocumentDrafts } from "./useDocumentDrafts";
import { useDocumentHubSync } from "./useDocumentHubSync";
import { useDraftDelivery } from "./useDraftDelivery";
import styles from "./fulfillment.module.css";
import type { TripDocumentSourceSelection } from "@/lib/types/TripDocumentSource";
interface Props {
  autoLoad?: boolean;
  countryLabels: Record<string, string>;
  locale: string;
  tripId: string;
  onAttached?: () => void | Promise<unknown>;
  onEnsureAttached?: (id: string) => Promise<unknown>;
  attachmentVersion?: number;
  source?: TripDocumentSourceSelection;
}
export function DocumentDraftPanel({
  autoLoad = false,
  countryLabels,
  locale,
  tripId,
  onAttached,
  onEnsureAttached,
  attachmentVersion = 0,
  source,
}: Props) {
  const dictionary = locale === "en" ? en : es;
  const copy = dictionary.documentDraftPanel;
  const workflow = dictionary.documentWorkflow;
  const drafts = useDocumentDrafts(tripId, autoLoad, source?.experienceId);
  const delivery = useDraftDelivery(tripId, drafts.selected, drafts.dirty);
  const deliveryCopy = dictionary.documentDraftDelivery;
  const [picker, setPicker] = useState(false);
  const [review, setReview] = useState(false);
  const dialogRef = useDocumentStageScroll(
    picker ? "picker" : review && delivery.url ? "review" : "edit",
  );
  const { refreshFailed, refreshPublished, refreshing } = useDocumentHubSync({
    drafts,
    delivery,
    attachmentVersion,
    onAttached,
    onEnsureAttached,
  });
  const {
    savePreview,
    cancelPending,
    pending: previewPending,
  } = useSaveDocumentPreview(drafts, delivery, source?.key);
  const titles = {
    "hotel-voucher": dictionary.hotelVoucherPdf.title,
    "activity-voucher": dictionary.activityVoucherPdf.title,
    "dinner-voucher": dictionary.dinnerVoucherPdf.title,
    "experience-roadmap": dictionary.experienceRoadmapPdf.title,
    "xsed-roadmap": dictionary.xsedRoadmapPdf.title,
  };
  const busy = drafts.busy || delivery.busy || previewPending || refreshing;
  const row = drafts.drafts.find((item) => item.id === drafts.selected?.id);
  const linkedId =
    delivery.attachedId ?? row?.documentId ?? drafts.selected?.documentId;
  function allowClose() {
    return (
      !drafts.dirty || window.confirm(dictionary.documentDraftEditor.discard)
    );
  }
  function close() {
    if (busy || !allowClose()) return;
    dismiss();
  }
  function dismiss() {
    cancelPending();
    setReview(false);
    setPicker(false);
    drafts.close();
  }
  const feedback = (
    <DocumentDraftFeedback
      busy={busy}
      delivery={delivery}
      dictionary={dictionary}
      drafts={drafts}
      onReload={() => {
        if (allowClose() && drafts.selected)
          void drafts.open(drafts.selected.id, true);
      }}
      refreshFailed={refreshFailed}
      refreshing={refreshing}
      refreshPublished={refreshPublished}
    />
  );

  return (
    <section className="my-6 flex flex-col gap-4 border-t border-gray-200 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-semibold text-ink">
          {workflow.privateDrafts}
        </h3>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={busy || (!!source && source.status !== "ready")}
          onClick={() => setPicker(true)}
          type="button"
        >
          {workflow.newDocument}
        </button>
      </div>
      <p className="text-sm text-neutral-500">{workflow.draftsNote}</p>
      {!drafts.selected && !picker && feedback}
      {(!drafts.loaded || drafts.error || drafts.operation?.kind === "list") &&
        !picker && (
          <DocumentActionButton
            className={styles.btn}
            disabled={busy}
            onClick={() => void drafts.list()}
            pending={drafts.operation?.kind === "list"}
            pendingLabel={dictionary.documentActions.loading}
            type="button"
          >
            {copy.load}
          </DocumentActionButton>
        )}
      {drafts.loaded && !drafts.drafts.some((item) => !item.documentId) && (
        <p className="text-sm text-neutral-500">{workflow.emptyDrafts}</p>
      )}
      <DocumentDraftList
        busy={busy}
        copy={deliveryCopy}
        drafts={drafts.drafts.filter((item) => !item.documentId)}
        onOpen={(id) => {
          if (allowClose()) {
            setReview(false);
            void drafts.open(id);
          }
        }}
        openingId={
          drafts.operation?.kind === "open" ? drafts.operation.id : undefined
        }
        openingLabel={dictionary.documentActions.opening}
        titles={titles}
      />
      {drafts.drafts.some((item) => item.documentId) && (
        <>
          <h3 className="text-xl font-semibold text-ink">
            {workflow.linkedDrafts}
          </h3>
          <DocumentDraftList
            busy={busy}
            copy={deliveryCopy}
            drafts={drafts.drafts.filter((item) => item.documentId)}
            onOpen={(id) => {
              if (allowClose()) {
                setReview(false);
                void drafts.open(id);
              }
            }}
            openingId={
              drafts.operation?.kind === "open"
                ? drafts.operation.id
                : undefined
            }
            openingLabel={dictionary.documentActions.opening}
            titles={titles}
          />
        </>
      )}
      <Dialog
        onOpenChange={(open) => {
          if (!open) close();
        }}
        open={picker || Boolean(drafts.selected)}
      >
        <DialogContent
          ref={dialogRef}
          className={`${styles.root} flex max-h-[92dvh] flex-col bg-white text-ink sm:max-w-5xl ${review && delivery.url ? "h-[92dvh] overflow-hidden" : "overflow-y-auto"}`}
          showCloseButton={false}
        >
          <DialogTitle>
            {picker
              ? workflow.chooseTemplate
              : review && delivery.url
                ? workflow.reviewDocument
                : workflow.editDocument}
          </DialogTitle>
          <DialogDescription>{workflow.draftsNote}</DialogDescription>
          {review && delivery.url && (
            <button
              className={`${styles.btn} self-end`}
              disabled={busy}
              onClick={close}
              type="button"
            >
              {dictionary.documentDraftEditor.close}
            </button>
          )}
          {feedback}
          {picker ? (
            <DocumentDraftCreation
              actions={dictionary.documentActions}
              autoLoad={autoLoad}
              busy={busy}
              closeLabel={dictionary.documentDraftEditor.close}
              copy={copy}
              drafts={drafts}
              onClose={close}
              onCreated={() => {
                setPicker(false);
                setReview(false);
              }}
              source={source}
              titles={titles}
              workflow={workflow}
            />
          ) : (
            drafts.document && (
              <>
                <DocumentDraftActions
                  busy={busy}
                  copy={copy}
                  deleting={drafts.operation?.kind === "delete"}
                  deletingLabel={dictionary.documentActions.deleting}
                  dirty={drafts.dirty}
                  moreLabel={workflow.moreActions}
                  onDelete={() => void drafts.removeSelected()}
                />
                {review && delivery.url ? (
                  <DocumentDraftReview
                    actions={dictionary.documentActions}
                    backLabel={workflow.backToEditing}
                    busy={busy}
                    copy={deliveryCopy}
                    linkedId={linkedId}
                    published={Boolean(delivery.attachedId)}
                    onAttach={(id) => void delivery.attach(id)}
                    onBack={() => setReview(false)}
                    operation={delivery.operation}
                    previewCopy={dictionary.documentPreview}
                    url={delivery.url}
                  />
                ) : (
                  <DocumentServerValidationContext.Provider
                    value={{
                      errors: delivery.fieldErrors,
                      attempt: delivery.validationAttempt,
                    }}
                  >
                    <DocumentDraftEditor
                      key={`${tripId}/${drafts.selected?.id}`}
                      busy={busy}
                      countryLabels={countryLabels}
                      dictionary={dictionary}
                      dirty={drafts.dirty}
                      onChange={(value) => {
                        cancelPending();
                        drafts.edit(value);
                      }}
                      onClose={dismiss}
                      onPreview={(value) => {
                        setReview(true);
                        void savePreview(value);
                      }}
                      onSave={() => void drafts.save()}
                      pending={
                        previewPending || delivery.operation === "render"
                          ? "preview"
                          : drafts.operation?.kind === "save"
                            ? "save"
                            : null
                      }
                      value={drafts.document}
                    />
                  </DocumentServerValidationContext.Provider>
                )}
              </>
            )
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
