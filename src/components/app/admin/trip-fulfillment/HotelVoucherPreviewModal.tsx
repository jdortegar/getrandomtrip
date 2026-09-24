"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Modal";
import type { HotelVoucherDocument } from "@/lib/types/HotelVoucher";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { HotelVoucherForm } from "./HotelVoucherForm";
import { useHotelVoucherPreview } from "./useHotelVoucherPreview";
import styles from "./fulfillment.module.css";

interface HotelVoucherPreviewModalProps {
  countryLabels: Record<string, string>;
  dictionary: Pick<
    MarketingDictionary,
    "hotelVoucherForm" | "hotelVoucherPdf" | "hotelVoucherPreview"
  >;
  initial: HotelVoucherDocument;
  onClose: () => void;
  tripId: string;
}
export function HotelVoucherPreviewModal({
  countryLabels,
  dictionary,
  initial,
  onClose,
  tripId,
}: HotelVoucherPreviewModalProps) {
  const [document, setDocument] = useState(initial);
  const preview = useHotelVoucherPreview(tripId, document);
  const copy = dictionary.hotelVoucherPreview;
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
        <HotelVoucherForm
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
