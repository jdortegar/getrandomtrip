"use client";

import { useState } from "react";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import type { HotelVoucherDocument } from "@/lib/types/HotelVoucher";
import type {
  HotelVoucherFormCopy,
  HotelVoucherPdfCopy,
} from "@/lib/types/dictionary";
import { DESTINATION_COUNTRY_CODES } from "@/lib/trips/destinationCountries";
import { parseHotelVoucher } from "@/lib/trip-documents/parsers/hotelVoucher";
import styles from "./fulfillment.module.css";

interface HotelVoucherFormProps {
  copy: HotelVoucherFormCopy;
  countryLabels: Record<string, string>;
  onChange: (value: HotelVoucherDocument) => void;
  onSubmit: (value: HotelVoucherDocument) => void;
  pdfCopy: HotelVoucherPdfCopy;
  submitting: boolean;
  value: HotelVoucherDocument;
}
export function HotelVoucherForm({
  copy,
  countryLabels,
  onChange,
  onSubmit,
  pdfCopy,
  submitting,
  value,
}: HotelVoucherFormProps) {
  const [invalid, setInvalid] = useState(false);
  const data = value.data;
  const fields = [
    ["holder", pdfCopy.holder, "text", true],
    ["guests", pdfCopy.guests, "text", true],
    ["checkInDate", pdfCopy.checkIn, "date", true],
    ["checkOutDate", pdfCopy.checkOut, "date", true],
    ["checkInTime", copy.checkInTime, "time", false],
    ["checkOutTime", copy.checkOutTime, "time", false],
    ["issueDate", pdfCopy.issued, "date", false],
    ["reservationReference", pdfCopy.reference, "text", false],
    ["paymentWording", pdfCopy.payment, "text", false],
    ["supplierConfirmation", pdfCopy.confirmation, "text", false],
  ] as const;
  const propertyFields = [
    ["name", copy.property, "text", true],
    ["address", pdfCopy.address, "text", true],
    ["contact", pdfCopy.contact, "text", false],
    ["locationUrl", pdfCopy.location, "url", false],
    ["providerUrl", pdfCopy.provider, "url", false],
  ] as const;
  function updateData(patch: Partial<typeof data>) {
    onChange({ ...value, data: { ...data, ...patch } });
  }
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const parsed = parseHotelVoucher(value, "generation");
    setInvalid(!parsed.ok);
    if (parsed.ok) onSubmit(parsed.value);
  }
  return (
    <form noValidate onSubmit={handleSubmit}>
      <fieldset className="flex flex-col gap-4" disabled={submitting}>
        <legend className="mb-4 text-sm text-neutral-700">{copy.note}</legend>
        <FormField
          id="hotel-label"
          label={copy.label}
          maxLength={120}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          required
          value={value.label}
        />
        <FormSelectField
          id="hotel-country"
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
          id="hotel-locale"
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
            id={`hotel-${key}`}
            key={key}
            label={label}
            maxLength={4000}
            onChange={(e) => updateData({ [key]: e.target.value })}
            required={required}
            type={type}
            value={data[key] ?? ""}
          />
        ))}
        {propertyFields.map(([key, label, type, required]) => (
          <FormField
            id={`hotel-property-${key}`}
            key={key}
            label={label}
            maxLength={4000}
            onChange={(e) =>
              updateData({
                property: { ...data.property, [key]: e.target.value },
              })
            }
            required={required}
            type={type}
            value={data.property[key] ?? ""}
          />
        ))}
        <TextAreaInput
          id="hotel-instructions"
          label={pdfCopy.instructions}
          maxLength={4000}
          onChange={(e) => updateData({ instructions: e.target.value })}
          value={data.instructions ?? ""}
        />
        {invalid && <p role="alert">{copy.invalid}</p>}
        <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">
          {copy.submit}
        </button>
      </fieldset>
    </form>
  );
}
