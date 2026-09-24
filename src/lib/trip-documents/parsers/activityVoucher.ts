import type { ActivityVoucherDocument } from "@/lib/types/ActivityVoucher";
import type { DocumentValidationMode } from "@/lib/types/DocumentMetadata";
import type { DocumentParseResult } from "@/lib/types/DocumentValidation";
import { validateDocumentMetadata } from "../documentMetadata";
import { isBoundedDocumentArray } from "../validationPrimitives";
import { createVoucherValidation } from "./createVoucherValidation";

const REQUIRED = ["participants", "date", "time"];
const OPTIONAL = [
  "holder",
  "issueDate",
  "reservationReference",
  "paymentWording",
  "supplierConfirmation",
  "recommendations",
];
const PROVIDER_FIELDS = [
  "name",
  "address",
  "contact",
  "locationUrl",
  "providerUrl",
];

export function parseActivityVoucher(
  input: unknown,
  mode: DocumentValidationMode,
): DocumentParseResult<ActivityVoucherDocument> {
  const { errors, add, record, text } = createVoucherValidation(mode);
  const raw = record(
    input,
    ["template", "templateVersion", "label", "country", "locale", "data"],
    "$",
  );
  if (!raw) return { ok: false, errors };
  if (raw.template !== "activity-voucher") add("template", "invalid_value");
  if (raw.templateVersion !== 1) add("templateVersion", "invalid_value");
  const metadata = validateDocumentMetadata(
    { label: raw.label, country: raw.country, locale: raw.locale },
    mode,
  );
  if (!metadata.ok) errors.push(...metadata.errors);
  const data = record(
    raw.data,
    [...REQUIRED, ...OPTIONAL, "provider", "program", "inclusions"],
    "data",
  );
  if (!data) return { ok: false, errors };
  for (const key of REQUIRED) text(data, key, `data.${key}`);
  for (const key of OPTIONAL) text(data, key, `data.${key}`, true);
  const provider = record(data.provider, PROVIDER_FIELDS, "data.provider");
  if (provider)
    for (const key of PROVIDER_FIELDS)
      text(
        provider,
        key,
        `data.provider.${key}`,
        key !== "name" && key !== "address",
      );
  for (const key of ["program", "inclusions"]) {
    if (key === "inclusions" && !Object.hasOwn(data, key)) continue;
    const items = data[key];
    if (!isBoundedDocumentArray(items)) {
      add(`data.${key}`, "invalid_array");
      continue;
    }
    if (key === "program" && mode === "generation" && !items.length)
      add("data.program", "required");
    const ids = new Set<string>();
    for (const [index, value] of items.entries()) {
      const path = `data.${key}.${index}`;
      const item = record(value, ["id", "title", "description"], path);
      if (!item) continue;
      for (const field of ["id", "title", "description"])
        text(item, field, `${path}.${field}`, field === "description");
      if (typeof item.id === "string") {
        if (ids.has(item.id)) add(`${path}.id`, "duplicate_id");
        ids.add(item.id);
      }
    }
  }
  if (errors.length || !metadata.ok) return { ok: false, errors };
  return {
    ok: true,
    value: { ...(input as ActivityVoucherDocument), ...metadata.value },
  };
}
