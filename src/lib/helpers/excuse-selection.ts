import {
  MAX_REFINE_DETAILS,
  XSED_LEVEL_ID,
  hasExcuseStep,
} from "@/lib/constants/product-config";
import { getExcusesByTravelerType } from "@/lib/data/shared/excuses";
import { travelerTypeOf, tripFamilyOf } from "@/lib/db/tripRequestFamily";

export type ExcuseSelectionErrorCode = "INVALID_EXCUSE" | "EXCUSE_REQUIRED";

export type ExcuseSelectionResult =
  | { ok: true; excuseKey: string | null; refineDetails: string[] }
  | { ok: false; errorCode: ExcuseSelectionErrorCode };

export interface ExcuseSelectionInput {
  type: string;
  /** Journey level; for XSED trips this holds the traveler type. */
  level?: string | null;
  status?: string | null;
  excuseKey?: string | null;
  refineDetails?: readonly string[] | null;
}

/**
 * Validate and normalize the excuse selection of a trip request.
 * - Step not applicable for the trip: selection is dropped silently.
 * - Excuse unknown for the traveler type: `INVALID_EXCUSE`.
 * - Excuse missing and status is not `DRAFT`: `EXCUSE_REQUIRED`.
 * - Refine details are filtered to the excuse's options and deduplicated and capped at `MAX_REFINE_DETAILS`.
 */
export function sanitizeExcuseSelection(
  input: ExcuseSelectionInput,
): ExcuseSelectionResult {
  const travelerType = travelerTypeOf({ type: input.type, level: input.level });
  const stepLevel =
    tripFamilyOf(input.type) === "xsed" ? XSED_LEVEL_ID : input.level;

  if (!hasExcuseStep(travelerType, stepLevel)) {
    return { ok: true, excuseKey: null, refineDetails: [] };
  }

  const excuseKey = input.excuseKey?.trim() || null;
  if (!excuseKey) {
    return input.status === "DRAFT"
      ? { ok: true, excuseKey: null, refineDetails: [] }
      : { ok: false, errorCode: "EXCUSE_REQUIRED" };
  }

  const excuse = getExcusesByTravelerType(travelerType).find(
    (candidate) => candidate.key === excuseKey,
  );
  if (!excuse) return { ok: false, errorCode: "INVALID_EXCUSE" };

  const allowed = new Set(excuse.details.options.map((option) => option.key));
  const refineDetails = [...new Set(input.refineDetails ?? [])]
    .filter((key) => allowed.has(key))
    .slice(0, MAX_REFINE_DETAILS);
  return { ok: true, excuseKey, refineDetails };
}
