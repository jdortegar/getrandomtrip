"use client";
import { useEffect, useRef } from "react";
import type { TripDocumentSnapshot } from "@/lib/types/TripDocumentSnapshot";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { HotelVoucherForm } from "./HotelVoucherForm";
import { ActivityVoucherForm } from "./ActivityVoucherForm";
import { DinnerVoucherForm } from "./DinnerVoucherForm";
import { ExperienceRoadmapForm } from "./ExperienceRoadmapForm";
import { XsedRoadmapForm } from "./XsedRoadmapForm";
import { DocumentFormWorkflowContext } from "./DocumentFormWorkflowContext";
import styles from "./fulfillment.module.css";
import { DocumentActionButton } from "./DocumentActionButton";
interface Props {
  busy: boolean;
  pending?: "save" | "preview" | null;
  countryLabels: Record<string, string>;
  dictionary: Pick<
    MarketingDictionary,
    | "hotelVoucherForm"
    | "hotelVoucherPdf"
    | "activityVoucherPdf"
    | "dinnerVoucherPdf"
    | "experienceRoadmapPdf"
    | "xsedRoadmapPdf"
    | "documentDraftEditor"
    | "documentWorkflow"
    | "documentActions"
  >;
  dirty: boolean;
  onChange: (document: TripDocumentSnapshot) => void;
  onClose: () => void;
  onPreview?: (document: TripDocumentSnapshot) => void;
  onSave: () => void;
  value: TripDocumentSnapshot;
}
/** Controlled content: only the owning panel decides when to open/reset drafts. */
export function DocumentDraftEditor({
  busy,
  pending = null,
  countryLabels,
  dictionary,
  dirty,
  onChange,
  onClose,
  onPreview,
  onSave,
  value,
}: Props) {
  const formRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  const common = {
    copy: dictionary.hotelVoucherForm,
    countryLabels,
    onChange,
    onSubmit: onPreview ?? (() => undefined),
    pdfCopy: dictionary.hotelVoucherPdf,
    submitting: busy,
  };
  let form;
  switch (value.template) {
    case "hotel-voucher":
      form = <HotelVoucherForm {...common} value={value} />;
      break;
    case "activity-voucher":
      form = (
        <ActivityVoucherForm
          {...common}
          activityCopy={dictionary.activityVoucherPdf}
          value={value}
        />
      );
      break;
    case "dinner-voucher":
      form = (
        <DinnerVoucherForm
          {...common}
          dinnerCopy={dictionary.dinnerVoucherPdf}
          value={value}
        />
      );
      break;
    case "experience-roadmap":
      form = (
        <ExperienceRoadmapForm
          {...common}
          roadmapCopy={dictionary.experienceRoadmapPdf}
          value={value}
        />
      );
      break;
    case "xsed-roadmap":
      form = (
        <XsedRoadmapForm
          {...common}
          roadmapCopy={dictionary.xsedRoadmapPdf}
          value={value}
        />
      );
      break;
  }
  const copy = dictionary.documentDraftEditor;
  return (
    <section className="flex flex-col gap-4">
      <p>{copy.note}</p>
      <DocumentFormWorkflowContext.Provider value={Boolean(onPreview)}>
        <div ref={formRef}>{form}</div>
      </DocumentFormWorkflowContext.Provider>
      <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-gray-200 bg-white py-4">
        <button
          className={styles.btn}
          disabled={busy}
          onClick={() => {
            if (!dirty || window.confirm(copy.discard)) onClose();
          }}
          type="button"
        >
          {copy.close}
        </button>
        <DocumentActionButton
          className={styles.btn}
          disabled={busy}
          onClick={onSave}
          pending={pending === "save"}
          pendingLabel={dictionary.documentActions.saving}
          type="button"
        >
          {copy.save}
        </DocumentActionButton>
        {onPreview && (
          <DocumentActionButton
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={busy}
            onClick={() =>
              formRef.current?.querySelector("form")?.requestSubmit()
            }
            pending={pending === "preview"}
            pendingLabel={dictionary.documentActions.savePreview}
            type="button"
          >
            {dictionary.documentWorkflow.savePreview}
          </DocumentActionButton>
        )}
      </div>
    </section>
  );
}
