import { hasLocale } from "@/lib/i18n/config";
import { isDestinationCountryCode } from "@/lib/trips/destinationCountries";
import type {
  DocumentMetadata,
  DocumentMetadataError,
  DocumentMetadataResult,
  DocumentValidationMode,
} from "@/lib/types/DocumentMetadata";

const METADATA_FIELDS = ["label", "country", "locale"] as const;
const MAX_LABEL_LENGTH = 120;

/** Drafts permit blank label/country; generation requires both. Locale is always required. */
export function validateDocumentMetadata(
  input: unknown,
  mode: DocumentValidationMode,
): DocumentMetadataResult {
  if (
    !input ||
    typeof input !== "object" ||
    (Object.getPrototypeOf(input) !== Object.prototype &&
      Object.getPrototypeOf(input) !== null) ||
    Reflect.ownKeys(input).some(
      (key) => !METADATA_FIELDS.some((field) => field === key),
    )
  ) {
    return { ok: false, errors: [{ path: "$", code: "invalid_shape" }] };
  }
  const errors: DocumentMetadataError[] = [];
  for (const path of METADATA_FIELDS) {
    if (typeof (input as Record<string, unknown>)[path] !== "string") {
      errors.push({ path, code: "invalid_type" });
    }
  }
  if (errors.length) return { ok: false, errors };
  const raw = input as DocumentMetadata;
  const value = { ...raw, label: raw.label.trim() };
  if (mode === "generation") {
    if (!value.label) errors.push({ path: "label", code: "required" });
    if (!value.country) errors.push({ path: "country", code: "required" });
  }
  if (value.label.length > MAX_LABEL_LENGTH) {
    errors.push({ path: "label", code: "too_long" });
  }
  if (value.country && !isDestinationCountryCode(value.country)) {
    errors.push({ path: "country", code: "invalid_country" });
  }
  if (!hasLocale(value.locale)) {
    errors.push({ path: "locale", code: "invalid_locale" });
  }
  return errors.length ? { ok: false, errors } : { ok: true, value };
}
