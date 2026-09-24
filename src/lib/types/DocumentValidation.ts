import type { DocumentMetadataError } from "@/lib/types/DocumentMetadata";

export interface DocumentFieldError {
  path: string;
  code:
    | DocumentMetadataError["code"]
    | "invalid_value"
    | "invalid_array"
    | "duplicate_id"
    | "invalid_date"
    | "invalid_range"
    | "invalid_time"
    | "invalid_url";
}

export type DocumentParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: DocumentFieldError[] };
