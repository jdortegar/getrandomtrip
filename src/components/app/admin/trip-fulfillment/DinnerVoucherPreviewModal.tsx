"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Modal";
import type { DinnerVoucherDocument } from "@/lib/types/DinnerVoucher";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { DinnerVoucherForm } from "./DinnerVoucherForm";
import { useDinnerVoucherPreview } from "./useDinnerVoucherPreview";
import styles from "./fulfillment.module.css";

interface DinnerVoucherPreviewModalProps {
  countryLabels: Record<string, string>;
  dictionary: Pick<
    MarketingDictionary,
    | "hotelVoucherForm"
    | "hotelVoucherPdf"
    | "hotelVoucherPreview"
    | "dinnerVoucherPdf"
    | "dinnerVoucherPreview"
  >;
  initial: DinnerVoucherDocument;
  onClose: () => void;
  tripId: string;
}
export function DinnerVoucherPreviewModal({
  countryLabels,
  dictionary,
  initial,
  onClose,
  tripId,
}: DinnerVoucherPreviewModalProps) {
  const [document, setDocument] = useState(initial);
  const preview = useDinnerVoucherPreview(tripId, document);
  const copy = {
    ...dictionary.hotelVoucherPreview,
    ...dictionary.dinnerVoucherPreview,
  };
  const dirty = JSON.stringify(document) !== JSON.stringify(initial);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  function close() {
    if (dirty && !window.confirm(copy.discard)) return;
    preview.reset();
    onClose();
  }
  return (
    <Modal
      className="max-h-[90dvh] overflow-y-auto sm:max-w-5xl"
      onOpenChange={(open) => {
        if (!open) close();
      }}
      open
      showCloseButton={false}
    >
      <DialogHeader>
        <DialogTitle>{copy.title}</DialogTitle>
        <DialogDescription>{copy.note}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-6 py-4 lg:grid-cols-2">
        <DinnerVoucherForm
          dinnerCopy={dictionary.dinnerVoucherPdf}
          copy={dictionary.hotelVoucherForm}
          countryLabels={countryLabels}
          onChange={setDocument}
          onSubmit={() => void preview.preview()}
          pdfCopy={dictionary.hotelVoucherPdf}
          submitting={preview.busy}
          value={document}
        />
        <div aria-busy={preview.busy} className="min-w-0">
          {preview.busy && <p role="status">{copy.pending}</p>}
          {preview.error && <p role="alert">{copy[preview.error]}</p>}
          {preview.url && (
            <>
              <a
                className="text-primary underline"
                href={preview.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {copy.view}
              </a>
              <iframe
                className="mt-3 h-[65dvh] w-full rounded border border-gray-200"
                src={preview.url}
                title={copy.title}
              />
            </>
          )}
        </div>
      </div>
      <button className={styles.btn} onClick={close} type="button">
        {copy.close}
      </button>
    </Modal>
  );
}
