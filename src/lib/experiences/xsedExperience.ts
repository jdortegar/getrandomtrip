import {
  getBasePricePerPerson,
  getXsedPricePerPerson,
} from "@/lib/data/traveler-types";
import { TRAVELER_EXPERIENCE_TYPES } from "./experienceTypeFilter";
import type { ExperienceClassification } from "@/types/tripper";

/** Includes canonical levels and unmigrated dedicated Sunday drops. */
export const XSED_EXPERIENCE_WHERE = {
  OR: [{ level: "xsed" }, { type: { has: "XSED" } }],
};

function storedTypes(type: ExperienceClassification["type"]): string[] {
  return Array.isArray(type) ? type : type ? [type] : [];
}

export function isXsedExperience(
  experience: ExperienceClassification,
): boolean {
  return (
    experience.level === "xsed" || storedTypes(experience.type).includes("XSED")
  );
}

/** Shared editors must not invent a traveler type for marker-only legacy rows. */
export function normalizeExperienceClassification(
  experience: ExperienceClassification,
) {
  return {
    type: storedTypes(experience.type).filter((type) => type !== "XSED"),
    level: isXsedExperience(experience)
      ? "xsed"
      : experience.level || "essenza",
  };
}

/** HTTP classification values are data, never Prisma mutation envelopes. */
export function hasValidExperienceClassificationShape(
  payload: unknown,
): boolean {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return false;
  const { type, level } = payload as Record<string, unknown>;
  return (
    (type === undefined ||
      (Array.isArray(type) &&
        type.every((value) => typeof value === "string"))) &&
    (level === undefined || level === null || typeof level === "string")
  );
}

/** Only XSED authoring is tightened here; ordinary drafts retain their contract. */
export function isValidSharedExperienceClassification(
  experience: ExperienceClassification,
): boolean {
  if (!isXsedExperience(experience)) return true;
  const types = storedTypes(experience.type);
  return (
    experience.level === "xsed" &&
    types.length > 0 &&
    types.every((type) =>
      (TRAVELER_EXPERIENCE_TYPES as readonly string[]).includes(type),
    )
  );
}

/** Experience pricing only: this does not add XSED to the journey level catalog. */
export function getExperienceBasePricePerPerson(
  type: string,
  level: string | null | undefined,
): number {
  if (
    level === "xsed" &&
    (TRAVELER_EXPERIENCE_TYPES as readonly string[]).includes(type)
  ) {
    return getXsedPricePerPerson(type);
  }
  return getBasePricePerPerson(type, level);
}

/**
 * BlogPost.level (not travelType) now carries the XSED marker — see
 * NewExperienceShell's `maybeCreateBlogPost`, which pairs this with
 * `level: isXsedExperience(experience) ? "xsed" : null`. This only returns
 * the experience's actual traveler types.
 */
export function getExperienceBlogTravelTypes(
  experience: ExperienceClassification,
): string[] {
  return storedTypes(experience.type);
}
