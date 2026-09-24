"use client";

import { useState } from "react";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import type { XsedRoadmapDocument } from "@/lib/types/XsedRoadmap";
import type {
  XsedRoadmapPdfCopy,
  HotelVoucherFormCopy,
  HotelVoucherPdfCopy,
} from "@/lib/types/dictionary";
import { DESTINATION_COUNTRY_CODES } from "@/lib/trips/destinationCountries";
import { parseXsedRoadmap } from "@/lib/trip-documents/parsers/xsedRoadmap";
import styles from "./fulfillment.module.css";
interface XsedRoadmapFormProps {
  copy: HotelVoucherFormCopy;
  countryLabels: Record<string, string>;
  onChange: (value: XsedRoadmapDocument) => void;
  onSubmit: (value: XsedRoadmapDocument) => void;
  pdfCopy: HotelVoucherPdfCopy;
  roadmapCopy: XsedRoadmapPdfCopy;
  submitting: boolean;
  value: XsedRoadmapDocument;
}
export function XsedRoadmapForm({
  copy,
  countryLabels,
  onChange,
  onSubmit,
  pdfCopy,
  roadmapCopy,
  submitting,
  value,
}: XsedRoadmapFormProps) {
  const [invalid, setInvalid] = useState(false);
  const fields = [
    ["origin", roadmapCopy.origin, "text", true],
    ["destination", roadmapCopy.destination, "text", true],
    ["departureDate", roadmapCopy.departureDate, "date", true],
    ["departureTime", roadmapCopy.departureTime, "time", true],
    ["drivingDuration", roadmapCopy.drivingDuration, "text", true],
    ["mapUrl", roadmapCopy.mapUrl, "url", false],
  ] as const;
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const parsed = parseXsedRoadmap(value, "generation");
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
          id="xsed-label"
          label={copy.label}
          maxLength={120}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          required
          value={value.label}
        />
        <FormSelectField
          id="xsed-country"
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
          id="xsed-locale"
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
            id={`xsed-${key}`}
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
        {invalid && <p role="alert">{copy.invalid}</p>}
        <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">
          {copy.submit}
        </button>
      </fieldset>
    </form>
  );
}
