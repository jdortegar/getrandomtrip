/** Internal, server-issued success receipt. Its ID is only for local deduplication. */
export interface AnalyticsAuthSuccess {
  event: "login" | "sign_up";
  id: string;
  issuedAt: number;
}
