"use client";
import { useEffect } from "react";
import type { TripDocumentSnapshot } from "@/lib/types/TripDocumentSnapshot";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { HotelVoucherForm } from "./HotelVoucherForm";
import { ActivityVoucherForm } from "./ActivityVoucherForm";
import { DinnerVoucherForm } from "./DinnerVoucherForm";
import { ExperienceRoadmapForm } from "./ExperienceRoadmapForm";
import { XsedRoadmapForm } from "./XsedRoadmapForm";
import styles from "./fulfillment.module.css";
interface Props {
  busy: boolean;
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
  >;
  dirty: boolean;
  onChange: (document: TripDocumentSnapshot) => void;
  onClose: () => void;
  onPreview: (document: TripDocumentSnapshot) => void;
  onSave: () => void;
  value: TripDocumentSnapshot;
}
/** Controlled content: only the owning panel decides when to open/reset drafts. */
export function DocumentDraftEditor({
  busy,
  countryLabels,
  dictionary,
  dirty,
  onChange,
  onClose,
  onPreview,
  onSave,
  value,
}: Props) {
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
    onSubmit: onPreview,
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
      <div className="flex flex-wrap gap-2">
        <button
          className={styles.btn}
          disabled={busy}
          onClick={onSave}
          type="button"
        >
          {copy.save}
        </button>
        <button
          className={styles.btn}
          onClick={() => {
            if (!dirty || window.confirm(copy.discard)) onClose();
          }}
          type="button"
        >
          {copy.close}
        </button>
      </div>
      {form}
    </section>
  );
}
