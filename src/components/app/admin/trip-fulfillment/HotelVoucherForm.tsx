"use client";

import { DocumentValidationGroup } from "./DocumentValidationGroup";
import { DocumentValidationForm } from "./DocumentValidationForm";
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
  return (
    <DocumentValidationForm
      copy={copy}
      onSubmit={onSubmit}
      parse={parseHotelVoucher}
      submitting={submitting}
      value={value}
    >
      <fieldset className="flex flex-col gap-4" disabled={submitting}>
        <legend className="mb-4 text-sm text-neutral-700">{copy.note}</legend>
        <FormField
          id="hotel-label"
          name="label"
          label={copy.label}
          maxLength={120}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          required
          value={value.label}
        />
        <FormSelectField
          id="hotel-country"
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
          id="hotel-locale"
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
            id={`hotel-${key}`}
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
        {propertyFields.map(([key, label, type, required]) => (
          <FormField
            id={`hotel-property-${key}`}
            name={`data.property.${key}`}
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
          name="data.instructions"
          label={pdfCopy.instructions}
          maxLength={4000}
          onChange={(e) => updateData({ instructions: e.target.value })}
          value={data.instructions ?? ""}
        />
        <DocumentValidationGroup
          className="flex flex-col gap-3"
          name="data.inclusions"
        >
          <legend>{pdfCopy.inclusions}</legend>
          {data.inclusions.map((item, index) => (
            <div
              className="flex flex-col gap-2 rounded border border-gray-200 p-3"
              key={item.id}
            >
              <FormField
                data-inclusion-title
                id={`hotel-inclusion-${item.id}`}
                name={`data.inclusions.${index}.title`}
                label={`${copy.itemTitle} ${index + 1}`}
                maxLength={4000}
                onChange={(e) =>
                  updateData({
                    inclusions: data.inclusions.map((row) =>
                      row.id === item.id
                        ? { ...row, title: e.target.value }
                        : row,
                    ),
                  })
                }
                required
                value={item.title}
              />
              <TextAreaInput
                id={`hotel-description-${item.id}`}
                name={`data.inclusions.${index}.description`}
                label={`${copy.description} ${index + 1}`}
                maxLength={4000}
                onChange={(e) =>
                  updateData({
                    inclusions: data.inclusions.map((row) =>
                      row.id === item.id
                        ? { ...row, description: e.target.value }
                        : row,
                    ),
                  })
                }
                value={item.description ?? ""}
              />
              <button
                className={styles.btn}
                data-move-up
                disabled={index === 0}
                onClick={() => {
                  const items = [...data.inclusions];
                  [items[index - 1], items[index]] = [
                    items[index],
                    items[index - 1],
                  ];
                  updateData({ inclusions: items });
                }}
                type="button"
              >
                {copy.up}
              </button>
              <button
                className={styles.btn}
                data-remove
                onClick={() =>
                  updateData({
                    inclusions: data.inclusions.filter(
                      (row) => row.id !== item.id,
                    ),
                  })
                }
                type="button"
              >
                {copy.remove}
              </button>
            </div>
          ))}
          <button
            className={styles.btn}
            disabled={data.inclusions.length >= 50}
            onClick={() => {
              updateData({
                inclusions: [
                  ...data.inclusions,
                  { id: crypto.randomUUID(), title: "" },
                ],
              });
            }}
            type="button"
          >
            {copy.add}
          </button>
        </DocumentValidationGroup>
        <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">
          {copy.submit}
        </button>
      </fieldset>
    </DocumentValidationForm>
  );
}
