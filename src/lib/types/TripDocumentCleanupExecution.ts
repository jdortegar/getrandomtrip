export interface TripDocumentCleanupExecutionJob {
  id: string;
  ownerId: string;
  tripRequestId: string | null;
  draftId: string | null;
  documentId: string | null;
  previewId: string | null;
  revision: number | null;
  purpose: string;
  disposition: string;
  targets: unknown;
}

export interface TripDocumentCleanupRuntime {
  findJob(id: string): Promise<TripDocumentCleanupExecutionJob | null>;
  deleteKey(key: string): Promise<void>;
}
