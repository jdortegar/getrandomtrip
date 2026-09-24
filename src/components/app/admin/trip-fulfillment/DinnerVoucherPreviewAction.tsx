"use client";

import { useState } from "react";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { AdminTripRequest } from "@/lib/admin/types";
import { DinnerVoucherPreviewModal } from "./DinnerVoucherPreviewModal";
import styles from "./fulfillment.module.css";

interface DinnerVoucherPreviewActionProps {
  countryLabels: Record<string, string>;
  locale: string;
  trip: Pick<AdminTripRequest, "id" | "startDate" | "endDate"> & {
    user: { name: string; locale: string | null };
  };
}
export function DinnerVoucherPreviewAction({
  countryLabels,
  locale,
  trip,
}: DinnerVoucherPreviewActionProps) {
  const [open, setOpen] = useState(false);
  const dictionary = locale === "en" ? en : es;
  const buyerLocale = trip.user.locale === "en" ? "en" : "es";
  return (
    <>
      <button
        className={`${styles.btn} ${styles.btnSecondary}`}
        onClick={() => setOpen(true)}
        type="button"
      >
        {dictionary.dinnerVoucherPreview.open}
      </button>
      {open && (
        <DinnerVoucherPreviewModal
          countryLabels={countryLabels}
          dictionary={dictionary}
          initial={{
            template: "dinner-voucher",
            templateVersion: 1,
            label: (buyerLocale === "en" ? en : es).dinnerVoucherPdf.title,
            locale: buyerLocale,
            country: "",
            data: {
              holder: trip.user.name,
              guests: "",
              date: trip.startDate?.slice(0, 10) ?? "",
              time: "",
              restaurant: { name: "", address: "" },
              service: "",
              menuItems: [],
            },
          }}
          key={trip.id}
          onClose={() => setOpen(false)}
          tripId={trip.id}
        />
      )}
    </>
  );
}
