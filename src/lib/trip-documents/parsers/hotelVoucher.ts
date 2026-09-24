import type { DocumentValidationMode } from "@/lib/types/DocumentMetadata";
import type { DocumentParseResult } from "@/lib/types/DocumentValidation";
import type { HotelVoucherDocument } from "@/lib/types/HotelVoucher";
import { validateDocumentMetadata } from "../documentMetadata";
import {
  isBoundedDocumentArray,
  isIsoCalendarDate,
  isOrderedDateRange,
} from "../validationPrimitives";

import { createVoucherValidation } from "./createVoucherValidation";

const REQUIRED = ["holder", "guests", "checkInDate", "checkOutDate"];
const OPTIONAL = [
  "checkInTime",
  "checkOutTime",
  "instructions",
  "issueDate",
  "reservationReference",
  "paymentWording",
  "supplierConfirmation",
];
const PROPERTY_FIELDS = [
  "name",
  "address",
  "contact",
  "locationUrl",
  "providerUrl",
];

export function parseHotelVoucher(
  input: unknown,
  mode: DocumentValidationMode,
): DocumentParseResult<HotelVoucherDocument> {
  const { errors, add, record, text } = createVoucherValidation(mode);
  const raw = record(
    input,
    ["template", "templateVersion", "label", "country", "locale", "data"],
    "$",
  );
  if (!raw) return { ok: false, errors };
  if (raw.template !== "hotel-voucher") add("template", "invalid_value");
  if (raw.templateVersion !== 1) add("templateVersion", "invalid_value");
  const metadata = validateDocumentMetadata(
    { label: raw.label, country: raw.country, locale: raw.locale },
    mode,
  );
  if (!metadata.ok) errors.push(...metadata.errors);
  const data = record(
    raw.data,
    [...REQUIRED, ...OPTIONAL, "property", "inclusions"],
    "data",
  );
  if (!data) return { ok: false, errors };
  for (const key of REQUIRED) text(data, key, `data.${key}`);
  for (const key of OPTIONAL) text(data, key, `data.${key}`, true);
  if (
    mode === "generation" &&
    isIsoCalendarDate(data.checkInDate) &&
    isIsoCalendarDate(data.checkOutDate) &&
    !isOrderedDateRange(data.checkInDate, data.checkOutDate)
  )
    add("data.checkOutDate", "invalid_range");
  const property = record(data.property, PROPERTY_FIELDS, "data.property");
  if (property)
    for (const key of PROPERTY_FIELDS)
      text(
        property,
        key,
        `data.property.${key}`,
        key !== "name" && key !== "address",
      );
  if (!isBoundedDocumentArray(data.inclusions))
    add("data.inclusions", "invalid_array");
  else {
    const ids = new Set<string>();
    for (const [index, value] of data.inclusions.entries()) {
      const path = `data.inclusions.${index}`;
      const item = record(value, ["id", "title", "description"], path);
      if (!item) continue;
      for (const key of ["id", "title", "description"])
        text(item, key, `${path}.${key}`, key === "description");
      if (typeof item.id === "string") {
        if (ids.has(item.id)) add(`${path}.id`, "duplicate_id");
        ids.add(item.id);
      }
    }
  }
  if (errors.length || !metadata.ok) return { ok: false, errors };
  return {
    ok: true,
    value: { ...(input as HotelVoucherDocument), ...metadata.value },
  };
}
