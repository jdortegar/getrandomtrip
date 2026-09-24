import type { TripDocumentSnapshot } from "./TripDocumentSnapshot";

export interface TripDocumentDraftPatch {
  revision: number;
  document: TripDocumentSnapshot;
}

/** Admin-only draft view. Never includes storage keys, hashes or source facts. */
export interface TripDocumentDraftDto extends TripDocumentDraftPatch {
  id: string;
  tripRequestId: string;
  documentId: string | null;
  publishedRevision: number | null;
  previewId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Structural DB boundary; validation handles unsupported stored versions. */
export interface TripDocumentDraftRecord {
  id: string;
  tripRequestId: string;
  template: string;
  templateVersion: number;
  label: string;
  locale: string;
  country: string;
  data: unknown;
  revision: number;
  documentId: string | null;
  publishedRevision: number | null;
  previewId: string | null;
  previewRevision: number | null;
  createdAt: Date;
  updatedAt: Date;
}
