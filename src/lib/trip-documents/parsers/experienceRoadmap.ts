import type { DocumentValidationMode } from "@/lib/types/DocumentMetadata";
import type { DocumentParseResult } from "@/lib/types/DocumentValidation";
import type { ExperienceRoadmapDocument } from "@/lib/types/ExperienceRoadmap";
import { validateDocumentMetadata } from "../documentMetadata";
import {
  isBoundedDocumentArray,
  isBoundedDocumentText,
  isHttpsUrl,
  isIsoCalendarDate,
  isOrderedDateRange,
  isWallTime,
} from "../validationPrimitives";

import { createDocumentValidation } from "./createDocumentValidation";

const DATA_FIELDS = [
  "origin",
  "destination",
  "startDate",
  "endDate",
  "duration",
  "heading",
  "mapUrl",
];

export function parseExperienceRoadmap(
  input: unknown,
  mode: DocumentValidationMode,
): DocumentParseResult<ExperienceRoadmapDocument> {
  const { errors, add, record } = createDocumentValidation();
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
      if (
        ["date", "startDate", "endDate"].includes(key) &&
        !isIsoCalendarDate(field)
      )
        add(path, "invalid_date");
      if (key === "time" && !isWallTime(field)) add(path, "invalid_time");
      if (key === "mapUrl" && !isHttpsUrl(field)) add(path, "invalid_url");
    }
  }
  const raw = record(
    input,
    ["template", "templateVersion", "label", "country", "locale", "data"],
    "$",
  );
  if (!raw) return { ok: false, errors };
  if (raw.template !== "experience-roadmap") add("template", "invalid_value");
  if (raw.templateVersion !== 1) add("templateVersion", "invalid_value");
  const metadata = validateDocumentMetadata(
    { label: raw.label, country: raw.country, locale: raw.locale },
    mode,
  );
  if (!metadata.ok) errors.push(...metadata.errors);
  const data = record(raw.data, [...DATA_FIELDS, "activities"], "data");
  if (!data) return { ok: false, errors };
  for (const key of DATA_FIELDS)
    text(data, key, `data.${key}`, key === "mapUrl");
  if (
    mode === "generation" &&
    isIsoCalendarDate(data.startDate) &&
    isIsoCalendarDate(data.endDate) &&
    !isOrderedDateRange(data.startDate, data.endDate)
  )
    add("data.endDate", "invalid_range");
  if (!isBoundedDocumentArray(data.activities))
    add("data.activities", "invalid_array");
  else {
    if (mode === "generation" && !data.activities.length)
      add("data.activities", "required");
    const ids = new Set<string>();
    for (const [index, value] of data.activities.entries()) {
      const path = `data.activities.${index}`;
      const activity = record(
        value,
        ["id", "title", "description", "date", "time"],
        path,
      );
      if (!activity) continue;
      for (const key of ["id", "title", "description", "date", "time"])
        text(activity, key, `${path}.${key}`, key === "date" || key === "time");
      if (typeof activity.id === "string") {
        if (ids.has(activity.id)) add(`${path}.id`, "duplicate_id");
        ids.add(activity.id);
      }
    }
  }
  if (errors.length || !metadata.ok) return { ok: false, errors };
  return {
    ok: true,
    value: { ...(input as ExperienceRoadmapDocument), ...metadata.value },
  };
}
