export interface TripDocumentCleanupFacts {
  trips: readonly { id: string; userId: string }[];
  drafts: readonly { id: string; tripRequestId: string }[];
  documents: readonly {
    id: string;
    tripRequestId: string;
    storageKey: string;
  }[];
}

export interface TripDocumentCleanupTarget {
  readonly id: string;
  readonly ownerId: string;
  readonly tripRequestId: string;
  readonly draftId: string | null;
  readonly documentId: string | null;
  readonly purpose: "scope-prefix" | "legacy-key";
  readonly disposition: "delete";
  readonly previewId: null;
  readonly revision: null;
  readonly expiresAt: null;
  readonly targets: {
    readonly keys: readonly string[];
    readonly prefixes: readonly string[];
  };
}
