"use client";

import { useState } from "react";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { AdminTripRequest } from "@/lib/admin/types";
import { HotelVoucherPreviewModal } from "./HotelVoucherPreviewModal";
import styles from "./fulfillment.module.css";

interface HotelVoucherPreviewActionProps {
  countryLabels: Record<string, string>;
  locale: string;
  trip: Pick<AdminTripRequest, "id" | "startDate" | "endDate"> & {
    user: { name: string; locale: string | null };
  };
}
export function HotelVoucherPreviewAction({
  countryLabels,
  locale,
  trip,
}: HotelVoucherPreviewActionProps) {
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
        {dictionary.hotelVoucherPreview.open}
      </button>
      {open && (
        <HotelVoucherPreviewModal
          countryLabels={countryLabels}
          dictionary={dictionary}
          initial={{
            template: "hotel-voucher",
            templateVersion: 1,
            label: (buyerLocale === "en" ? en : es).hotelVoucherPdf.title,
            locale: buyerLocale,
            country: "",
            data: {
              holder: trip.user.name,
              guests: "",
              checkInDate: trip.startDate?.slice(0, 10) ?? "",
              checkOutDate: trip.endDate?.slice(0, 10) ?? "",
              property: { name: "", address: "" },
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
