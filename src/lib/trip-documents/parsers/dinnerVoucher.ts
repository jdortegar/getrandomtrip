import type { DinnerVoucherDocument } from "@/lib/types/DinnerVoucher";
import type { DocumentValidationMode } from "@/lib/types/DocumentMetadata";
import type { DocumentParseResult } from "@/lib/types/DocumentValidation";
import { validateDocumentMetadata } from "../documentMetadata";
import { isBoundedDocumentArray } from "../validationPrimitives";
import { createVoucherValidation } from "./createVoucherValidation";

const REQUIRED = ["guests", "date", "time", "service"];
const OPTIONAL = [
  "holder",
  "issueDate",
  "reservationReference",
  "paymentWording",
  "supplierConfirmation",
  "conditions",
];
const RESTAURANT_FIELDS = [
  "name",
  "address",
  "contact",
  "locationUrl",
  "providerUrl",
];

export function parseDinnerVoucher(
  input: unknown,
  mode: DocumentValidationMode,
): DocumentParseResult<DinnerVoucherDocument> {
  const { errors, add, record, text } = createVoucherValidation(mode);
  const raw = record(
    input,
    ["template", "templateVersion", "label", "country", "locale", "data"],
    "$",
  );
  if (!raw) return { ok: false, errors };
  if (raw.template !== "dinner-voucher") add("template", "invalid_value");
  if (raw.templateVersion !== 1) add("templateVersion", "invalid_value");
  const metadata = validateDocumentMetadata(
    { label: raw.label, country: raw.country, locale: raw.locale },
    mode,
  );
  if (!metadata.ok) errors.push(...metadata.errors);
  const data = record(
    raw.data,
    [...REQUIRED, ...OPTIONAL, "restaurant", "menuItems"],
    "data",
  );
  if (!data) return { ok: false, errors };
  for (const key of REQUIRED) text(data, key, `data.${key}`);
  for (const key of OPTIONAL) text(data, key, `data.${key}`, true);
  const restaurant = record(
    data.restaurant,
    RESTAURANT_FIELDS,
    "data.restaurant",
  );
  if (restaurant)
    for (const key of RESTAURANT_FIELDS)
      text(
        restaurant,
        key,
        `data.restaurant.${key}`,
        key !== "name" && key !== "address",
      );
  if (!isBoundedDocumentArray(data.menuItems))
    add("data.menuItems", "invalid_array");
  else {
    const ids = new Set<string>();
    for (const [index, value] of data.menuItems.entries()) {
      const path = `data.menuItems.${index}`;
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
    value: { ...(input as DinnerVoucherDocument), ...metadata.value },
  };
}
