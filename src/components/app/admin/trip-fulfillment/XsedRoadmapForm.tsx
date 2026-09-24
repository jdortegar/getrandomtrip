"use client";
import { DocumentFieldGroup } from "./DocumentFieldGroup";
import { DocumentFormSubmit } from "./DocumentFormSubmit";

import { DocumentValidationForm } from "./DocumentValidationForm";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import type { XsedRoadmapDocument } from "@/lib/types/XsedRoadmap";
import type {
  XsedRoadmapPdfCopy,
  HotelVoucherFormCopy,
  HotelVoucherPdfCopy,
} from "@/lib/types/dictionary";
import { DESTINATION_COUNTRY_CODES } from "@/lib/trips/destinationCountries";
import { parseXsedRoadmap } from "@/lib/trip-documents/parsers/xsedRoadmap";
import { XsedRoadmapStops } from "./XsedRoadmapStops";
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
  const fields = [
    ["origin", roadmapCopy.origin, "text", true],
    ["destination", roadmapCopy.destination, "text", true],
    ["departureDate", roadmapCopy.departureDate, "date", true],
    ["departureTime", roadmapCopy.departureTime, "time", true],
    ["drivingDuration", roadmapCopy.drivingDuration, "text", true],
    ["mapUrl", roadmapCopy.mapUrl, "url", false],
  ] as const;
  return (
    <DocumentValidationForm
      copy={copy}
      onSubmit={onSubmit}
      parse={parseXsedRoadmap}
      submitting={submitting}
      value={value}
    >
      <fieldset className="flex flex-col gap-4" disabled={submitting}>
        <legend className="mb-4 text-sm text-neutral-700">
          {roadmapCopy.note}
        </legend>
        <DocumentFieldGroup label={copy.groups.metadata}>
          <FormField
            id="xsed-label"
            name="label"
            label={copy.label}
            maxLength={120}
            onChange={(e) => onChange({ ...value, label: e.target.value })}
            required
            value={value.label}
          />
          <FormSelectField
            id="xsed-country"
            name="country"
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
            name="locale"
            label={copy.locale}
            onChange={(e) =>
              onChange({ ...value, locale: e.target.value as "en" | "es" })
            }
            value={value.locale}
          >
            <option value="en">{copy.english}</option>
            <option value="es">{copy.spanish}</option>
          </FormSelectField>
        </DocumentFieldGroup>
        <DocumentFieldGroup label={copy.groups.route}>
          {fields.map(([key, label, type, required]) => (
            <FormField
              id={`xsed-${key}`}
              name={`data.${key}`}
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
        </DocumentFieldGroup>
        <DocumentFieldGroup label={copy.groups.content}>
          <XsedRoadmapStops
            copy={copy}
            disabled={submitting}
            items={value.data.stops}
            onChange={(stops) =>
              onChange({ ...value, data: { ...value.data, stops } })
            }
            roadmapCopy={roadmapCopy}
            title={roadmapCopy.stops}
          />
        </DocumentFieldGroup>
        <DocumentFormSubmit label={copy.submit} />
      </fieldset>
    </DocumentValidationForm>
  );
}
