import type { DocumentParseResult } from "@/lib/types/DocumentValidation";
import type { TripDocumentSnapshot } from "@/lib/types/TripDocumentSnapshot";
import type {
  TripDocumentDraftDto,
  TripDocumentDraftPatch,
  TripDocumentDraftRecord,
} from "@/lib/types/TripDocumentDraft";
import { parseActivityVoucher } from "./parsers/activityVoucher";
import { parseDinnerVoucher } from "./parsers/dinnerVoucher";
import { parseExperienceRoadmap } from "./parsers/experienceRoadmap";
import { parseHotelVoucher } from "./parsers/hotelVoucher";
import { parseXsedRoadmap } from "./parsers/xsedRoadmap";

function record(input: unknown): input is Record<string, unknown> {
  return (
    !!input &&
    typeof input === "object" &&
    (Object.getPrototypeOf(input) === Object.prototype ||
      Object.getPrototypeOf(input) === null)
  );
}

/** Reuses draft-mode rules: incomplete content is not generation-ready content. */
export function parseDraftDocument(
  input: unknown,
): DocumentParseResult<TripDocumentSnapshot> {
  if (!record(input))
    return { ok: false, errors: [{ path: "$", code: "invalid_shape" }] };
  switch (input.template) {
    case "hotel-voucher":
      return parseHotelVoucher(input, "draft");
    case "activity-voucher":
      return parseActivityVoucher(input, "draft");
    case "dinner-voucher":
      return parseDinnerVoucher(input, "draft");
    case "experience-roadmap":
      return parseExperienceRoadmap(input, "draft");
    case "xsed-roadmap":
      return parseXsedRoadmap(input, "draft");
    default:
      return {
        ok: false,
        errors: [{ path: "template", code: "invalid_value" }],
      };
  }
}

export function parseDraftPatch(
  input: unknown,
): DocumentParseResult<TripDocumentDraftPatch> {
  if (
    !record(input) ||
    Reflect.ownKeys(input).some(
      (key) => key !== "revision" && key !== "document",
    )
  )
    return { ok: false, errors: [{ path: "$", code: "invalid_shape" }] };
  if (!Number.isSafeInteger(input.revision) || Number(input.revision) < 1)
    return { ok: false, errors: [{ path: "revision", code: "invalid_value" }] };
  const parsed = parseDraftDocument(input.document);
  if (!parsed.ok)
    return {
      ok: false,
      errors: parsed.errors.map((error) => ({
        ...error,
        path: error.path === "$" ? "document" : `document.${error.path}`,
      })),
    };
  return {
    ok: true,
    value: { revision: input.revision as number, document: parsed.value },
  };
}

/** Explicit allowlist: never spread DB rows into client-visible output. */
export function toDraftDto(row: TripDocumentDraftRecord): TripDocumentDraftDto {
  const parsed = parseDraftDocument({
    template: row.template,
    templateVersion: row.templateVersion,
    label: row.label,
    country: row.country,
    locale: row.locale,
    data: row.data,
  });
  if (!parsed.ok) throw new Error("INVALID_STORED_DOCUMENT_DRAFT");
  return {
    id: row.id,
    tripRequestId: row.tripRequestId,
    revision: row.revision,
    document: parsed.value,
    documentId: row.documentId,
    publishedRevision: row.publishedRevision,
    previewId: row.previewRevision === row.revision ? row.previewId : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
