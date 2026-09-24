"use client";

import { useState } from "react";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { AdminTripRequest } from "@/lib/admin/types";
import { XsedRoadmapPreviewModal } from "./XsedRoadmapPreviewModal";
import styles from "./fulfillment.module.css";

interface XsedRoadmapPreviewActionProps {
  countryLabels: Record<string, string>;
  locale: string;
  trip: Pick<
    AdminTripRequest,
    "id" | "startDate" | "originCity" | "actualDestination"
  > & {
    user: { name: string; locale: string | null };
  };
}
export function XsedRoadmapPreviewAction({
  countryLabels,
  locale,
  trip,
}: XsedRoadmapPreviewActionProps) {
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
        {dictionary.xsedRoadmapPreview.open}
      </button>
      {open && (
        <XsedRoadmapPreviewModal
          countryLabels={countryLabels}
          dictionary={dictionary}
          initial={{
            template: "xsed-roadmap",
            templateVersion: 1,
            label: (buyerLocale === "en" ? en : es).xsedRoadmapPdf.title,
            locale: buyerLocale,
            country: "",
            data: {
              origin: trip.originCity,
              destination: trip.actualDestination ?? "",
              departureDate: trip.startDate?.slice(0, 10) ?? "",
              departureTime: "",
              drivingDuration: "",
              stops: [],
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
