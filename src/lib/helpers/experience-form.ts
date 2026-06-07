import type { ExperienceFormDraft } from "@/types/tripper";

/**
 * Returns a completeness summary across all tabs.
 * Used by both the server-side submit endpoint and the client-side gate.
 * Pure function — no DOM or client dependencies.
 */
export function getExperienceCompleteness(form: ExperienceFormDraft): {
  complete: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!form.title) missing.push("title");
  if (!form.type || form.type.length === 0) missing.push("type");
  if (!form.level) missing.push("level");
  if (!form.teaser) missing.push("teaser");
  if (!form.description) missing.push("description");
  if (!form.heroImage) missing.push("heroImage");
  if (!form.destinationCountry) missing.push("destinationCountry");
  if (!form.destinationCity) missing.push("destinationCity");
  if (!form.activities[0]?.name) missing.push("activityName");

  return { complete: missing.length === 0, missing };
}

export function getMissingFields(
  tabId: string,
  form: ExperienceFormDraft,
  labels: Record<string, string>,
): string[] {
  const m: string[] = [];
  switch (tabId) {
    case "about":
      if (!form.title) m.push(labels.title ?? "Título");
      if (!form.teaser) m.push(labels.teaser ?? "Teaser");
      if (!form.description) m.push(labels.description ?? "Descripción");
      if (!form.destinationCountry) m.push(labels.country ?? "País de destino");
      if (!form.destinationCity) m.push(labels.city ?? "Ciudad");
      break;
    case "logistics":
      break;
    case "activities":
      if (!form.activities[0]?.name)
        m.push(labels.activityName ?? "Nombre de la actividad");
      break;
    case "media":
      return m;
  }
  return m;
}

export function isExperienceTabComplete(
  tabId: string,
  form: ExperienceFormDraft,
): boolean {
  switch (tabId) {
    case "about":
      return !!(
        form.title &&
        form.teaser &&
        form.description &&
        form.destinationCountry &&
        form.destinationCity
      );
    case "logistics":
      return true;
    case "activities":
      return !!form.activities[0]?.name;
    case "media":
      return !!(form.tags.length > 0 || form.highlights.length > 0);
    default:
      return false;
  }
}
