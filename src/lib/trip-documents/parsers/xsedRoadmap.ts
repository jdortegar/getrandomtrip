import type { DocumentValidationMode } from "@/lib/types/DocumentMetadata";
import type {
  DocumentFieldError,
  DocumentParseResult,
} from "@/lib/types/DocumentValidation";
import type { XsedRoadmapDocument } from "@/lib/types/XsedRoadmap";
import { validateDocumentMetadata } from "../documentMetadata";
import {
  isBoundedDocumentArray,
  isBoundedDocumentText,
  isHttpsUrl,
  isIsoCalendarDate,
  isWallTime,
} from "../validationPrimitives";

const DATA_FIELDS = [
  "origin",
  "destination",
  "departureDate",
  "departureTime",
  "drivingDuration",
  "mapUrl",
];

export function parseXsedRoadmap(
  input: unknown,
  mode: DocumentValidationMode,
): DocumentParseResult<XsedRoadmapDocument> {
  const errors: DocumentFieldError[] = [];
  const add = (path: string, code: DocumentFieldError["code"]) =>
    errors.push({ path, code });
  function record(
    value: unknown,
    fields: string[],
    path: string,
  ): Record<string, unknown> | null {
    if (
      !value ||
      typeof value !== "object" ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value)) ||
      Reflect.ownKeys(value).some(
        (key) =>
          !fields.some((field) => field === key) ||
          !Object.prototype.propertyIsEnumerable.call(value, key),
      )
    ) {
      add(path, "invalid_shape");
      return null;
    }
    return value as Record<string, unknown>;
  }
  function text(
    value: Record<string, unknown>,
    key: string,
    path: string,
    optional = false,
  ) {
    if (optional && !Object.hasOwn(value, key)) return;
    const field = value[key];
    if (typeof field !== "string") add(path, "invalid_type");
    else if (!isBoundedDocumentText(field)) add(path, "too_long");
    else if (
      !optional &&
      (mode === "generation" || key === "id") &&
      !field.trim()
    )
      add(path, "required");
    else if (mode === "generation" && field) {
      if (["date", "departureDate"].includes(key) && !isIsoCalendarDate(field))
        add(path, "invalid_date");
      if (["time", "departureTime"].includes(key) && !isWallTime(field))
        add(path, "invalid_time");
      if (key === "mapUrl" && !isHttpsUrl(field)) add(path, "invalid_url");
    }
  }
  const raw = record(
    input,
    ["template", "templateVersion", "label", "country", "locale", "data"],
    "$",
  );
  if (!raw) return { ok: false, errors };
  if (raw.template !== "xsed-roadmap") add("template", "invalid_value");
  if (raw.templateVersion !== 1) add("templateVersion", "invalid_value");
  const metadata = validateDocumentMetadata(
    { label: raw.label, country: raw.country, locale: raw.locale },
    mode,
  );
  if (!metadata.ok) errors.push(...metadata.errors);
  const data = record(raw.data, [...DATA_FIELDS, "stops"], "data");
  if (!data) return { ok: false, errors };
  for (const key of DATA_FIELDS)
    text(data, key, `data.${key}`, key === "mapUrl");
  if (!isBoundedDocumentArray(data.stops)) add("data.stops", "invalid_array");
  else {
    if (mode === "generation" && !data.stops.length)
      add("data.stops", "required");
    const ids = new Set<string>();
    for (const [index, value] of data.stops.entries()) {
      const path = `data.stops.${index}`;
      const stop = record(
        value,
        ["id", "title", "directions", "date", "time"],
        path,
      );
      if (!stop) continue;
      for (const key of ["id", "title", "directions", "date", "time"])
        text(stop, key, `${path}.${key}`, key === "date" || key === "time");
      if (typeof stop.id === "string") {
        if (ids.has(stop.id)) add(`${path}.id`, "duplicate_id");
        ids.add(stop.id);
      }
    }
  }
  if (errors.length || !metadata.ok) return { ok: false, errors };
  return {
    ok: true,
    value: { ...(input as XsedRoadmapDocument), ...metadata.value },
  };
}
