"use client";

import { useState } from "react";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import type { ActivityVoucherDocument } from "@/lib/types/ActivityVoucher";
import type {
  HotelVoucherFormCopy,
  HotelVoucherPdfCopy,
  ActivityVoucherPdfCopy,
} from "@/lib/types/dictionary";
import { DESTINATION_COUNTRY_CODES } from "@/lib/trips/destinationCountries";
import { parseActivityVoucher } from "@/lib/trip-documents/parsers/activityVoucher";
import { ActivityVoucherItems } from "./ActivityVoucherItems";
import styles from "./fulfillment.module.css";

interface ActivityVoucherFormProps {
  activityCopy: ActivityVoucherPdfCopy;
  copy: HotelVoucherFormCopy;
  countryLabels: Record<string, string>;
  onChange: (value: ActivityVoucherDocument) => void;
  onSubmit: (value: ActivityVoucherDocument) => void;
  pdfCopy: HotelVoucherPdfCopy;
  submitting: boolean;
  value: ActivityVoucherDocument;
}
export function ActivityVoucherForm({
  activityCopy,
  copy,
  countryLabels,
  onChange,
  onSubmit,
  pdfCopy,
  submitting,
  value,
}: ActivityVoucherFormProps) {
  const [invalid, setInvalid] = useState(false);
  const data = value.data;
  const fields = [
    ["holder", pdfCopy.holder, "text", false],
    ["participants", activityCopy.participants, "text", true],
    ["date", activityCopy.date, "date", true],
    ["time", activityCopy.time, "time", true],
    ["issueDate", pdfCopy.issued, "date", false],
    ["reservationReference", pdfCopy.reference, "text", false],
    ["paymentWording", pdfCopy.payment, "text", false],
    ["supplierConfirmation", pdfCopy.confirmation, "text", false],
  ] as const;
  const providerFields = [
    ["name", activityCopy.providerName, "text", true],
    ["address", pdfCopy.address, "text", true],
    ["contact", pdfCopy.contact, "text", false],
    ["locationUrl", pdfCopy.location, "url", false],
    ["providerUrl", activityCopy.provider, "url", false],
  ] as const;
  function updateData(patch: Partial<typeof data>) {
    onChange({ ...value, data: { ...data, ...patch } });
  }
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const parsed = parseActivityVoucher(value, "generation");
    setInvalid(!parsed.ok);
    if (parsed.ok) onSubmit(parsed.value);
  }
  return (
    <form noValidate onSubmit={handleSubmit}>
      <fieldset className="flex flex-col gap-4" disabled={submitting}>
        <legend className="mb-4 text-sm text-neutral-700">{copy.note}</legend>
        <FormField
          id="activity-label"
          label={copy.label}
          maxLength={120}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          required
          value={value.label}
        />
        <FormSelectField
          id="activity-country"
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
          id="activity-locale"
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
            id={`activity-${key}`}
            key={key}
            label={label}
            maxLength={4000}
            onChange={(e) => updateData({ [key]: e.target.value })}
            required={required}
            type={type}
            value={data[key] ?? ""}
          />
        ))}
        {providerFields.map(([key, label, type, required]) => (
          <FormField
            id={`activity-provider-${key}`}
            key={key}
            label={label}
            maxLength={4000}
            onChange={(e) =>
              updateData({
                provider: { ...data.provider, [key]: e.target.value },
              })
            }
            required={required}
            type={type}
            value={data.provider[key] ?? ""}
          />
        ))}
        <TextAreaInput
          id="activity-recommendations"
          label={activityCopy.recommendations}
          maxLength={4000}
          onChange={(e) => updateData({ recommendations: e.target.value })}
          value={data.recommendations ?? ""}
        />
        {["program", "inclusions"].map((section) => {
          const key = section as "program" | "inclusions";
          return (
            <ActivityVoucherItems
              addLabel={activityCopy.addItem}
              copy={copy}
              items={data[key] ?? []}
              key={key}
              onChange={(items) => updateData({ [key]: items })}
              section={key}
              title={
                key === "program" ? activityCopy.program : pdfCopy.inclusions
              }
            />
          );
        })}
        {invalid && <p role="alert">{copy.invalid}</p>}
        <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">
          {copy.submit}
        </button>
      </fieldset>
    </form>
  );
}
