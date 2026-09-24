"use client";

import { useState } from "react";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { AdminTripRequest } from "@/lib/admin/types";
import { ActivityVoucherPreviewModal } from "./ActivityVoucherPreviewModal";
import styles from "./fulfillment.module.css";

interface ActivityVoucherPreviewActionProps {
  countryLabels: Record<string, string>;
  locale: string;
  trip: Pick<AdminTripRequest, "id" | "startDate" | "endDate"> & {
    user: { name: string; locale: string | null };
  };
}
export function ActivityVoucherPreviewAction({
  countryLabels,
  locale,
  trip,
}: ActivityVoucherPreviewActionProps) {
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
        {dictionary.activityVoucherPreview.open}
      </button>
      {open && (
        <ActivityVoucherPreviewModal
          countryLabels={countryLabels}
          dictionary={dictionary}
          initial={{
            template: "activity-voucher",
            templateVersion: 1,
            label: (buyerLocale === "en" ? en : es).activityVoucherPdf.title,
            locale: buyerLocale,
            country: "",
            data: {
              holder: trip.user.name,
              participants: "",
              date: trip.startDate?.slice(0, 10) ?? "",
              time: "",
              provider: { name: "", address: "" },
              program: [],
              inclusions: [],
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
