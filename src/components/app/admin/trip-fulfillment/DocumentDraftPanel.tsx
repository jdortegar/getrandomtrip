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
import { DocumentTemplatePicker } from "./DocumentTemplatePicker";
import { useDocumentDrafts } from "./useDocumentDrafts";
import { useDocumentHubSync } from "./useDocumentHubSync";
import { useDraftDelivery } from "./useDraftDelivery";
import styles from "./fulfillment.module.css";
interface Props {
  autoLoad?: boolean;
  countryLabels: Record<string, string>;
  locale: string;
  tripId: string;
  onAttached?: () => void | Promise<unknown>;
  onEnsureAttached?: (id: string) => Promise<unknown>;
  attachmentVersion?: number;
}
export function DocumentDraftPanel({
  autoLoad = false,
  countryLabels,
  locale,
  tripId,
  onAttached,
  onEnsureAttached,
  attachmentVersion = 0,
}: Props) {
  const dictionary = locale === "en" ? en : es;
  const copy = dictionary.documentDraftPanel;
  const workflow = dictionary.documentWorkflow;
  const drafts = useDocumentDrafts(tripId, autoLoad);
  const delivery = useDraftDelivery(tripId, drafts.selected, drafts.dirty);
  const deliveryCopy = dictionary.documentDraftDelivery;
  const [picker, setPicker] = useState(false);
  const [review, setReview] = useState(false);
  const dialogRef = useDocumentStageScroll(
    picker ? "picker" : review && delivery.url ? "review" : "edit",
  );
  const { refreshFailed, refreshPublished } = useDocumentHubSync({
    drafts,
    delivery,
    attachmentVersion,
    onAttached,
    onEnsureAttached,
  });
  const { savePreview, cancelPending } = useSaveDocumentPreview(
    drafts,
    delivery,
  );
  const titles = {
    "hotel-voucher": dictionary.hotelVoucherPdf.title,
    "activity-voucher": dictionary.activityVoucherPdf.title,
    "dinner-voucher": dictionary.dinnerVoucherPdf.title,
    "experience-roadmap": dictionary.experienceRoadmapPdf.title,
    "xsed-roadmap": dictionary.xsedRoadmapPdf.title,
  };
  const busy = drafts.busy || delivery.busy;
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
          void drafts.open(drafts.selected.id);
      }}
      refreshFailed={refreshFailed}
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
          disabled={busy}
          onClick={() => setPicker(true)}
          type="button"
        >
          {workflow.newDocument}
        </button>
      </div>
      <p className="text-sm text-neutral-500">{workflow.draftsNote}</p>
      {!drafts.selected && !picker && feedback}
      {(!drafts.loaded || drafts.error) && !picker && (
        <button
          className={styles.btn}
          disabled={busy}
          onClick={() => void drafts.list()}
          type="button"
        >
          {copy.load}
        </button>
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
          className={`${styles.root} flex max-h-[92dvh] flex-col overflow-y-auto bg-white text-ink sm:max-w-5xl`}
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
            <>
              {drafts.error && (
                <button
                  className={styles.btn}
                  disabled={busy}
                  onClick={() => void drafts.list()}
                  type="button"
                >
                  {copy.load}
                </button>
              )}
              <DocumentTemplatePicker
                busy={busy || (autoLoad && !drafts.loaded)}
                candidates={drafts.candidates}
                copy={copy}
                onCreate={(template, candidate) => {
                  void drafts.create(template, candidate).then((created) => {
                    if (created) {
                      setPicker(false);
                      setReview(false);
                    }
                  });
                }}
                titles={titles}
              />
              <button
                className={styles.btn}
                disabled={busy}
                onClick={close}
                type="button"
              >
                {dictionary.documentDraftEditor.close}
              </button>
            </>
          ) : (
            drafts.document && (
              <>
                <details className="self-end">
                  <summary className="cursor-pointer text-sm text-neutral-500">
                    {workflow.moreActions}
                  </summary>
                  <button
                    className={styles.btn}
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(copy.deleteConfirm))
                        void drafts.removeSelected();
                    }}
                    type="button"
                  >
                    {copy.delete}
                  </button>
                </details>
                {!drafts.dirty && !busy && (
                  <p className="text-sm text-neutral-500" role="status">
                    {copy.saved}
                  </p>
                )}
                {review && delivery.url ? (
                  <DocumentDraftReview
                    backLabel={workflow.backToEditing}
                    busy={busy}
                    copy={deliveryCopy}
                    linkedId={linkedId}
                    published={Boolean(delivery.attachedId)}
                    onAttach={(id) => void delivery.attach(id)}
                    onBack={() => setReview(false)}
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
