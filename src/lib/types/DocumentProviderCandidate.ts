import type { VoucherProvider } from "./VoucherData";

export type DocumentProviderRole = "hotel" | "activity" | "dinner";

/** Raw JSON facts, with source kind supplied by the trusted trip loader. */
export interface DocumentProviderSource {
  kind: "experience" | "xsed";
  hotels?: unknown;
  activities?: unknown;
  sections?: unknown;
}

export interface DocumentProviderCandidate {
  role: DocumentProviderRole;
  /** Original source-array index, not an index into filtered candidates. */
  index: number;
  title: string;
  provider: VoucherProvider;
}
