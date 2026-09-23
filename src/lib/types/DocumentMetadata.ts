import type { Locale } from "@/lib/i18n/config";

export interface DocumentMetadata {
  label: string;
  country: string;
  locale: Locale;
}

export type DocumentValidationMode = "draft" | "generation";

export interface DocumentMetadataError {
  path: keyof DocumentMetadata | "$";
  code:
    | "required"
    | "too_long"
    | "invalid_country"
    | "invalid_locale"
    | "invalid_shape"
    | "invalid_type";
}

export type DocumentMetadataResult =
  | { ok: true; value: DocumentMetadata }
  | { ok: false; errors: DocumentMetadataError[] };
