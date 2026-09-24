"use client";

import { useState } from "react";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { AdminTripRequest } from "@/lib/admin/types";
import { ExperienceRoadmapPreviewModal } from "./ExperienceRoadmapPreviewModal";
import styles from "./fulfillment.module.css";

interface ExperienceRoadmapPreviewActionProps {
  countryLabels: Record<string, string>;
  locale: string;
  trip: Pick<
    AdminTripRequest,
    "id" | "startDate" | "endDate" | "originCity" | "actualDestination"
  > & {
    user: { name: string; locale: string | null };
  };
}
export function ExperienceRoadmapPreviewAction({
  countryLabels,
  locale,
  trip,
}: ExperienceRoadmapPreviewActionProps) {
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
        {dictionary.experienceRoadmapPreview.open}
      </button>
      {open && (
        <ExperienceRoadmapPreviewModal
          countryLabels={countryLabels}
          dictionary={dictionary}
          initial={{
            template: "experience-roadmap",
            templateVersion: 1,
            label: (buyerLocale === "en" ? en : es).experienceRoadmapPdf.title,
            locale: buyerLocale,
            country: "",
            data: {
              origin: trip.originCity,
              destination: trip.actualDestination ?? "",
              startDate: trip.startDate?.slice(0, 10) ?? "",
              endDate: trip.endDate?.slice(0, 10) ?? "",
              duration: "",
              heading: "",
              activities: [],
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
