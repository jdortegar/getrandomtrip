export interface TripDocumentLockRef {
  id: string;
  tripRequestId: string;
}

export interface TripDocumentCleanupLockRef {
  id: string;
  tripRequestId: string | null;
}

export interface TripDocumentLockScope {
  ownerId: string;
  tripIds?: readonly string[];
  drafts?: readonly TripDocumentLockRef[];
  documents?: readonly TripDocumentLockRef[];
  cleanupJobs?: readonly TripDocumentCleanupLockRef[];
}
