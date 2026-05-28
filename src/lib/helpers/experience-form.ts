import type { ExperienceFormDraft } from '@/types/tripper';

export function isExperienceTabComplete(tabId: string, form: ExperienceFormDraft): boolean {
  switch (tabId) {
    case 'about':
      return !!(
        form.title &&
        form.teaser &&
        form.destinationCountry &&
        form.destinationCity &&
        form.excuseKey
      );
    case 'capacity':
      return !!(form.estimatedCost && form.season);
    case 'logistics':
      return !!(
        form.travelTime &&
        form.accommodations[0]?.hotelName &&
        form.accommodations[0]?.hotelLocation
      );
    case 'activities':
      return !!(form.activities[0]?.name && form.itinerary[0]?.title);
    default:
      return false;
  }
}
