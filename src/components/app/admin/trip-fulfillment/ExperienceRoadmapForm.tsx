"use client";

import { useState } from "react";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import type { ExperienceRoadmapDocument } from "@/lib/types/ExperienceRoadmap";
import type {
  ExperienceRoadmapPdfCopy,
  HotelVoucherFormCopy,
  HotelVoucherPdfCopy,
} from "@/lib/types/dictionary";
import { DESTINATION_COUNTRY_CODES } from "@/lib/trips/destinationCountries";
import { parseExperienceRoadmap } from "@/lib/trip-documents/parsers/experienceRoadmap";
import { ExperienceRoadmapActivities } from "./ExperienceRoadmapActivities";
import styles from "./fulfillment.module.css";
interface ExperienceRoadmapFormProps {
  copy: HotelVoucherFormCopy;
  countryLabels: Record<string, string>;
  onChange: (value: ExperienceRoadmapDocument) => void;
  onSubmit: (value: ExperienceRoadmapDocument) => void;
  pdfCopy: HotelVoucherPdfCopy;
  roadmapCopy: ExperienceRoadmapPdfCopy;
  submitting: boolean;
  value: ExperienceRoadmapDocument;
}
export function ExperienceRoadmapForm({
  copy,
  countryLabels,
  onChange,
  onSubmit,
  pdfCopy,
  roadmapCopy,
  submitting,
  value,
}: ExperienceRoadmapFormProps) {
  const [invalid, setInvalid] = useState(false);
  const fields = [
    ["origin", roadmapCopy.origin, "text", true],
    ["destination", roadmapCopy.destination, "text", true],
    ["startDate", roadmapCopy.startDate, "date", true],
    ["endDate", roadmapCopy.endDate, "date", true],
    ["duration", roadmapCopy.duration, "text", true],
    ["heading", roadmapCopy.heading, "text", true],
    ["mapUrl", roadmapCopy.mapUrl, "url", false],
  ] as const;
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const parsed = parseExperienceRoadmap(value, "generation");
    setInvalid(!parsed.ok);
    if (parsed.ok) onSubmit(parsed.value);
  }
  return (
    <form noValidate onSubmit={handleSubmit}>
      <fieldset className="flex flex-col gap-4" disabled={submitting}>
        <legend className="mb-4 text-sm text-neutral-700">
          {roadmapCopy.note}
        </legend>
        <FormField
          id="experience-label"
          label={copy.label}
          maxLength={120}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          required
          value={value.label}
        />
        <FormSelectField
          id="experience-country"
          label={pdfCopy.country}
          onChange={(e) => onChange({ ...value, country: e.target.value })}
          required
          value={value.country}
        >
          <option value="">—</option>
          {DESTINATION_COUNTRY_CODES.map((code) => (
            <option key={code} value={code}>
              {countryLabels[code] ?? code}
            </option>
          ))}
        </FormSelectField>
        <FormSelectField
          id="experience-locale"
          label={copy.locale}
          onChange={(e) =>
            onChange({ ...value, locale: e.target.value as "en" | "es" })
          }
          value={value.locale}
        >
          <option value="en">{copy.english}</option>
          <option value="es">{copy.spanish}</option>
        </FormSelectField>
        {fields.map(([key, label, type, required]) => (
          <FormField
            id={`experience-${key}`}
            key={key}
            label={label}
            maxLength={4000}
            onChange={(e) =>
              onChange({
                ...value,
                data: { ...value.data, [key]: e.target.value },
              })
            }
            required={required}
            type={type}
            value={value.data[key] ?? ""}
          />
        ))}
        <ExperienceRoadmapActivities
          copy={copy}
          disabled={submitting}
          items={value.data.activities}
          onChange={(activities) =>
            onChange({ ...value, data: { ...value.data, activities } })
          }
          roadmapCopy={roadmapCopy}
          title={roadmapCopy.activities}
        />
        {invalid && <p role="alert">{copy.invalid}</p>}
        <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">
          {copy.submit}
        </button>
      </fieldset>
    </form>
  );
}
