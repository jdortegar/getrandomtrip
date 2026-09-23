export interface TripDocumentCandidateInput {
  ownerId: string;
  tripRequestId: string;
  draftId: string;
  revision: number;
  purpose: "preview" | "publication";
  previewId?: string;
  document?: { id: string; state: "reserved" | "existing" };
  expiresAt: Date;
}

export interface TripDocumentCandidateRuntime {
  randomId?: () => string;
  now?: () => number;
}
