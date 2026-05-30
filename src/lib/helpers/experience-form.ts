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
      if (!form.destinationCity) m.push(labels.city ?? "Ciudad de destino");
      if (!form.excuseKey) m.push(labels.excuseKey ?? "Excusa del viaje");
      break;
    case "capacity":
      if (!(form.basePrice > 0)) m.push(labels.basePrice ?? "Precio base");
      if (!form.displayPrice)
        m.push(labels.displayPrice ?? "Precio de visualización");
      break;
    case "logistics":
      if (!form.travelTime)
        m.push(labels.estimatedTravelTime ?? "Tiempo estimado de traslado");
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
        form.destinationCity &&
        form.excuseKey
      );
    case "capacity":
      return !!(form.basePrice > 0 && form.displayPrice);
    case "logistics":
      return !!(
        form.travelTime &&
        form.accommodations[0]?.hotelName &&
        form.accommodations[0]?.hotelLocation
      );
    case "activities":
      return !!(form.activities[0]?.name && form.itinerary[0]?.title);
    default:
      return false;
  }
}
