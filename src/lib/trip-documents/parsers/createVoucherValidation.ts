import type { DocumentValidationMode } from "@/lib/types/DocumentMetadata";
import {
  isBoundedDocumentText,
  isHttpsUrl,
  isIsoCalendarDate,
  isWallTime,
} from "../validationPrimitives";
import { createDocumentValidation } from "./createDocumentValidation";

export function createVoucherValidation(mode: DocumentValidationMode) {
  const { errors, add, record } = createDocumentValidation();
  function text(
    value: Record<string, unknown>,
    key: string,
    path: string,
    optional = false,
  ) {
    if (optional && !Object.hasOwn(value, key)) return;
    const field = value[key];
    if (typeof field !== "string") add(path, "invalid_type");
    else if (!isBoundedDocumentText(field)) add(path, "too_long");
    else if (
      !optional &&
      (mode === "generation" || key === "id") &&
      !field.trim()
    )
      add(path, "required");
    else if (mode === "generation" && field) {
      if (key.endsWith("Date") && !isIsoCalendarDate(field))
        add(path, "invalid_date");
      if (key.endsWith("Time") && !isWallTime(field)) add(path, "invalid_time");
      if (key.endsWith("Url") && !isHttpsUrl(field)) add(path, "invalid_url");
    }
  }
  return { errors, add, record, text };
}
