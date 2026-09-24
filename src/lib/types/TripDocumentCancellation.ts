export type TripDocumentCancellationScope = { ownerId: string } & (
  | { kind: "account" }
  | { kind: "trip"; tripRequestId: string }
  | { kind: "draft" | "document"; tripRequestId: string; id: string }
);
