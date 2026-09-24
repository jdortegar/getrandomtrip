"use client";

import { DocumentValidationForm } from "./DocumentValidationForm";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import type { DinnerVoucherDocument } from "@/lib/types/DinnerVoucher";
import type {
  HotelVoucherFormCopy,
  HotelVoucherPdfCopy,
  DinnerVoucherPdfCopy,
} from "@/lib/types/dictionary";
import { DESTINATION_COUNTRY_CODES } from "@/lib/trips/destinationCountries";
import { parseDinnerVoucher } from "@/lib/trip-documents/parsers/dinnerVoucher";
import { DinnerVoucherMenu } from "./DinnerVoucherMenu";
import styles from "./fulfillment.module.css";

interface DinnerVoucherFormProps {
  dinnerCopy: DinnerVoucherPdfCopy;
  copy: HotelVoucherFormCopy;
  countryLabels: Record<string, string>;
  onChange: (value: DinnerVoucherDocument) => void;
  onSubmit: (value: DinnerVoucherDocument) => void;
  pdfCopy: HotelVoucherPdfCopy;
  submitting: boolean;
  value: DinnerVoucherDocument;
}
export function DinnerVoucherForm({
  dinnerCopy,
  copy,
  countryLabels,
  onChange,
  onSubmit,
  pdfCopy,
  submitting,
  value,
}: DinnerVoucherFormProps) {
  const data = value.data;
  const fields = [
    ["holder", pdfCopy.holder, "text", false],
    ["guests", dinnerCopy.guests, "text", true],
    ["date", dinnerCopy.date, "date", true],
    ["time", dinnerCopy.time, "time", true],
    ["service", dinnerCopy.service, "text", true],
    ["issueDate", pdfCopy.issued, "date", false],
    ["reservationReference", pdfCopy.reference, "text", false],
    ["paymentWording", pdfCopy.payment, "text", false],
    ["supplierConfirmation", pdfCopy.confirmation, "text", false],
  ] as const;
  const restaurantFields = [
    ["name", dinnerCopy.restaurantName, "text", true],
    ["address", pdfCopy.address, "text", true],
    ["contact", pdfCopy.contact, "text", false],
    ["locationUrl", pdfCopy.location, "url", false],
    ["providerUrl", dinnerCopy.provider, "url", false],
  ] as const;
  function updateData(patch: Partial<typeof data>) {
    onChange({ ...value, data: { ...data, ...patch } });
  }
  return (
    <DocumentValidationForm
      copy={copy}
      onSubmit={onSubmit}
      parse={parseDinnerVoucher}
      submitting={submitting}
      value={value}
    >
      <fieldset className="flex flex-col gap-4" disabled={submitting}>
        <legend className="mb-4 text-sm text-neutral-700">{copy.note}</legend>
        <FormField
          id="dinner-label"
          name="label"
          label={copy.label}
          maxLength={120}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          required
          value={value.label}
        />
        <FormSelectField
          id="dinner-country"
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
          id="dinner-locale"
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
        {fields.map(([key, label, type, required]) => (
          <FormField
            id={`dinner-${key}`}
            name={`data.${key}`}
            key={key}
            label={label}
            maxLength={4000}
            onChange={(e) => updateData({ [key]: e.target.value })}
            required={required}
            type={type}
            value={data[key] ?? ""}
          />
        ))}
        {restaurantFields.map(([key, label, type, required]) => (
          <FormField
            id={`dinner-restaurant-${key}`}
            name={`data.restaurant.${key}`}
            key={key}
            label={label}
            maxLength={4000}
            onChange={(e) =>
              updateData({
                restaurant: { ...data.restaurant, [key]: e.target.value },
              })
            }
            required={required}
            type={type}
            value={data.restaurant[key] ?? ""}
          />
        ))}
        <TextAreaInput
          id="dinner-conditions"
          name="data.conditions"
          label={dinnerCopy.conditions}
          maxLength={4000}
          onChange={(e) => updateData({ conditions: e.target.value })}
          value={data.conditions ?? ""}
        />
        <DinnerVoucherMenu
          addLabel={dinnerCopy.addItem}
          copy={copy}
          disabled={submitting}
          items={data.menuItems}
          onChange={(menuItems) => updateData({ menuItems })}
          title={dinnerCopy.menu}
        />
        <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">
          {copy.submit}
        </button>
      </fieldset>
    </DocumentValidationForm>
  );
}
