"use client";
import { useEffect, useRef, useState } from "react";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { TripDocumentSnapshot } from "@/lib/types/TripDocumentSnapshot";
import { DocumentServerValidationContext } from "./DocumentServerValidationContext";
import { DocumentDraftEditor } from "./DocumentDraftEditor";
import { useDocumentDrafts } from "./useDocumentDrafts";
import { useDraftDelivery } from "./useDraftDelivery";
import styles from "./fulfillment.module.css";
interface Props {
  autoLoad?: boolean;
  countryLabels: Record<string, string>;
  locale: string;
  tripId: string;
  onAttached?: () => void;
}
export function DocumentDraftPanel({
  autoLoad = false,
  countryLabels,
  locale,
  tripId,
  onAttached,
}: Props) {
  const dictionary = locale === "en" ? en : es;
  const copy = dictionary.documentDraftPanel;
  const drafts = useDocumentDrafts(tripId, autoLoad);
  const delivery = useDraftDelivery(tripId, drafts.selected, drafts.dirty);
  const deliveryCopy = dictionary.documentDraftDelivery;
  const editorRef = useRef<HTMLDivElement>(null);
  const notified = useRef<string | null>(null);
  useEffect(() => {
    if (!delivery.publicationEvent) {
      notified.current = null;
      return;
    }
    if (notified.current !== delivery.publicationEvent) {
      notified.current = delivery.publicationEvent;
      onAttached?.();
    }
  }, [delivery.publicationEvent, onAttached]);
  const linkedId = delivery.attachedId ?? drafts.selected?.documentId;

  const [template, setTemplate] =
    useState<TripDocumentSnapshot["template"]>("hotel-voucher");
  const [candidate, setCandidate] = useState("");
  const titles = {
    "hotel-voucher": dictionary.hotelVoucherPdf.title,
    "activity-voucher": dictionary.activityVoucherPdf.title,
    "dinner-voucher": dictionary.dinnerVoucherPdf.title,
    "experience-roadmap": dictionary.experienceRoadmapPdf.title,
    "xsed-roadmap": dictionary.xsedRoadmapPdf.title,
  };
  const role =
    template === "hotel-voucher"
      ? "hotel"
      : template === "activity-voucher"
        ? "activity"
        : template === "dinner-voucher"
          ? "dinner"
          : null;
  const candidates = role ? drafts.candidates[role] : [];
  function allowSwitch() {
    return (
      !drafts.dirty || window.confirm(dictionary.documentDraftEditor.discard)
    );
  }
  return (
    <section className="my-6 flex flex-col gap-4 rounded border border-gray-200 p-4">
      <h3>{autoLoad ? copy.generate : copy.title}</h3>
      {autoLoad && <p>{copy.sourceNote}</p>}
      <button
        className={styles.btn}
        disabled={drafts.busy || delivery.busy}
        onClick={() => void drafts.list()}
        type="button"
      >
        {copy.load}
      </button>
      <label>
        {copy.template}
        <select
          disabled={drafts.busy || delivery.busy}
          onChange={(event) => {
            setTemplate(event.target.value as typeof template);
            setCandidate("");
          }}
          value={template}
        >
          {Object.entries(titles).map(([key, title]) => (
            <option key={key} value={key}>
              {title}
            </option>
          ))}
        </select>
      </label>
      {candidates.length > 0 && (
        <label>
          {copy.provider}
          <select
            disabled={drafts.busy || delivery.busy}
            onChange={(event) => setCandidate(event.target.value)}
            value={candidate}
          >
            <option value="">{copy.none}</option>
            {candidates.map((item) => (
              <option key={item.index} value={item.index}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        className={styles.btn}
        disabled={drafts.busy || delivery.busy || (autoLoad && !drafts.loaded)}
        onClick={() => {
          if (allowSwitch())
            void drafts.create(
              template,
              candidate === "" ? undefined : Number(candidate),
            );
        }}
        type="button"
      >
        {copy.create}
      </button>
      <ul>
        {drafts.drafts.map((row) => (
          <li key={row.id}>
            <button
              className={styles.btn}
              data-open-draft
              disabled={drafts.busy || delivery.busy}
              onClick={() => {
                if (allowSwitch()) void drafts.open(row.id);
              }}
              type="button"
            >
              {row.document.label || titles[row.document.template]}
            </button>
          </li>
        ))}
      </ul>
      {drafts.busy && <p role="status">{copy.pending}</p>}
      {drafts.error && (
        <p role="alert">
          {drafts.error === "conflict" ? copy.conflict : copy.error}
        </p>
      )}
      {drafts.error === "conflict" && drafts.selected && (
        <button
          className={styles.btn}
          onClick={() => {
            if (allowSwitch()) void drafts.open(drafts.selected!.id);
          }}
          type="button"
        >
          {copy.reload}
        </button>
      )}
      {drafts.selected && !drafts.dirty && !drafts.busy && (
        <p role="status">{copy.saved}</p>
      )}
      {drafts.selected && (
        <p role="status">
          {delivery.attachedId
            ? deliveryCopy.attached
            : !drafts.selected.documentId
              ? deliveryCopy.draft
              : drafts.selected.publishedRevision === drafts.selected.revision
                ? deliveryCopy.attached
                : deliveryCopy.unpublished}
        </p>
      )}
      {drafts.selected && (
        <button
          className={styles.btn}
          disabled={drafts.busy || delivery.busy}
          onClick={() => {
            if (window.confirm(copy.deleteConfirm))
              void drafts.removeSelected();
          }}
          type="button"
        >
          {copy.delete}
        </button>
      )}
      {drafts.document && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div ref={editorRef}>
            {drafts.dirty && <p>{deliveryCopy.saveFirst}</p>}
            <button
              className={styles.btn}
              disabled={drafts.busy || delivery.busy || drafts.dirty}
              onClick={() =>
                editorRef.current?.querySelector("form")?.requestSubmit()
              }
              type="button"
            >
              {deliveryCopy.preview}
            </button>

            <DocumentServerValidationContext.Provider
              value={{
                errors: delivery.fieldErrors,
                attempt: delivery.validationAttempt,
              }}
            >
              <DocumentDraftEditor
                key={`${tripId}/${drafts.selected?.id}`}
                busy={drafts.busy || delivery.busy}
                countryLabels={countryLabels}
                dictionary={dictionary}
                dirty={drafts.dirty}
                onChange={drafts.edit}
                onClose={drafts.close}
                onPreview={() => {
                  if (!drafts.dirty) void delivery.render();
                }}
                onSave={() => void drafts.save()}
                value={drafts.document}
              />
            </DocumentServerValidationContext.Provider>
          </div>
          <div className="min-w-0">
            {delivery.busy && <p role="status">{copy.pending}</p>}
            {delivery.error && (
              <p role="alert">{deliveryCopy[delivery.error]}</p>
            )}
            {delivery.error === "attach_request_expired" && (
              <button
                className={styles.btn}
                onClick={() => {
                  if (window.confirm(deliveryCopy.resetConfirm))
                    delivery.resetExpiredRequest();
                }}
                type="button"
              >
                {deliveryCopy.reset}
              </button>
            )}
            {delivery.url && (
              <>
                <p>{deliveryCopy.memoryNotice}</p>
                <a
                  href={delivery.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {deliveryCopy.view}
                </a>
                <iframe
                  className="mt-3 h-[65dvh] w-full rounded border border-gray-200"
                  src={delivery.url}
                  title={deliveryCopy.preview}
                />
                <button
                  className={styles.btn}
                  disabled={delivery.busy || drafts.busy || drafts.dirty}
                  onClick={() => {
                    if (
                      !linkedId ||
                      window.confirm(deliveryCopy.confirmReplace)
                    )
                      void delivery.attach(linkedId ?? undefined);
                  }}
                  type="button"
                >
                  {linkedId ? deliveryCopy.replace : deliveryCopy.attach}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
