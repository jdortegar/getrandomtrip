import type { ExperienceFormDraft } from "@/types/tripper";

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
      if (!form.accommodations[0]?.hotelName)
        m.push(labels.hotelName ?? "Nombre del hotel");
      if (!form.accommodations[0]?.hotelLocation)
        m.push(labels.hotelLocation ?? "Ubicación del hotel");
      break;
    case "activities":
      if (!form.activities[0]?.name)
        m.push(labels.activityName ?? "Nombre de la actividad");
      if (!form.itinerary[0]?.title)
        m.push(labels.itineraryTitle ?? "Titulo del día 1");
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
      return !!(
        form.accommodations[0]?.hotelName &&
        form.accommodations[0]?.hotelLocation
      );
    case "activities":
      return !!(form.activities[0]?.name && form.itinerary[0]?.title);
    case "media":
      return !!(form.tags.length > 0 || form.highlights.length > 0);
    default:
      return false;
  }
}
