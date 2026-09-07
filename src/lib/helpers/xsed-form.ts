import type {
  AccommodationEntry,
  ActivityEntry,
  XsedDropDraft,
  XsedDropStatus,
  XsedSection,
} from "@/types/xsed";
import { EMPTY_XSED_DRAFT, normalizeXsedSection } from "@/types/xsed";

export interface XsedPublishFields {
  destinationCity: string;
  destinationCountry: string;
  titleInternal: string;
  tripDate: string;
}

export interface XsedFinalizeCopy {
  confirmBody: string;
  confirmTitle: string;
  isPublish: boolean;
  submitLabel: string;
}

function isSectionFilled(section: XsedSection | undefined): boolean {
  return !!(section && section.title.trim() && section.body.trim());
}

function isActivityEntryFilled(entry: ActivityEntry | undefined): boolean {
  return !!(
    entry &&
    entry.name.trim() &&
    entry.durationRhythm &&
    entry.description.trim() &&
    entry.risks.trim()
  );
}

export function toXsedPublishField(value: unknown): string {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") return value;
  return "";
}

export function resolveXsedPublishFields(
  incoming: Partial<Record<keyof XsedPublishFields, unknown>>,
  existing: Partial<Record<keyof XsedPublishFields, unknown>> = {},
): XsedPublishFields {
  return {
    destinationCity: toXsedPublishField(incoming.destinationCity ?? existing.destinationCity),
    destinationCountry: toXsedPublishField(
      incoming.destinationCountry ?? existing.destinationCountry,
    ),
    titleInternal: toXsedPublishField(incoming.titleInternal ?? existing.titleInternal),
    tripDate: toXsedPublishField(incoming.tripDate ?? existing.tripDate),
  };
}

/** General-tab gate for Publish / Save and the PUT ACTIVE API. */
export function canPublishXsedDrop(form: XsedPublishFields): boolean {
  return !!(
    form.titleInternal.trim() &&
    form.tripDate.trim() &&
    form.destinationCity.trim() &&
    form.destinationCountry.trim()
  );
}

export function resolveXsedFinalizeCopy(
  dict: {
    publish: { confirmBody: string; confirmTitle: string; submitLabel: string };
    save: { confirmBody: string; confirmTitle: string; submitLabel: string };
  },
  status: XsedDropStatus,
): XsedFinalizeCopy {
  const isPublish = status === "DRAFT";
  const copy = isPublish ? dict.publish : dict.save;
  return { ...copy, isPublish };
}

export function isXsedTabComplete(tabId: string, form: XsedDropDraft): boolean {
  switch (tabId) {
    case "main":
      return canPublishXsedDrop(form);
    case "logistics": {
      const hotel = form.hotels[0];
      const accommodationComplete = !!(
        hotel &&
        hotel.hotelName.trim() &&
        form.sections[0]?.contact?.address.trim() &&
        isSectionFilled(form.sections[0])
      );
      const dinnerComplete =
        isActivityEntryFilled(form.activities[0]) && isSectionFilled(form.sections[1]);
      const activityComplete =
        isActivityEntryFilled(form.activities[1]) && isSectionFilled(form.sections[2]);
      const itineraryComplete =
        form.itinerary.length > 0 &&
        form.itinerary.every((day) => day.title.trim() && day.description.trim());
      const inclusionsComplete =
        form.inclusions.length > 0 &&
        form.inclusions.every((v) => v.trim()) &&
        form.exclusions.length > 0 &&
        form.exclusions.every((v) => v.trim());
      return (
        accommodationComplete &&
        dinnerComplete &&
        activityComplete &&
        itineraryComplete &&
        inclusionsComplete
      );
    }
    default:
      return true;
  }
}

function padActivities(raw: ActivityEntry[] | undefined): ActivityEntry[] {
  const padded = EMPTY_XSED_DRAFT.activities.map((empty) => ({ ...empty }));
  if (!Array.isArray(raw)) return padded;
  raw.slice(0, padded.length).forEach((entry, i) => {
    padded[i] = { ...padded[i], ...entry };
  });
  return padded;
}

function padSections(raw: unknown[] | undefined): XsedSection[] {
  return EMPTY_XSED_DRAFT.sections.map((empty, i) =>
    normalizeXsedSection(raw?.[i] ?? empty),
  );
}

function padHotels(raw: unknown): AccommodationEntry[] {
  if (!Array.isArray(raw) || raw.length === 0) return EMPTY_XSED_DRAFT.hotels;
  return raw.map((hotel) => {
    const entry = hotel as Partial<AccommodationEntry>;
    return {
      ...EMPTY_XSED_DRAFT.hotels[0],
      ...entry,
      hotelDays: entry.hotelDays?.trim() ? entry.hotelDays : "1",
    };
  });
}

/** Pads hotels/activities/sections to the fixed XSED authoring shape. */
export function normalizeXsedDraft(
  partial: Partial<Omit<XsedDropDraft, "hotels" | "activities" | "sections" | "itinerary" | "inclusions" | "exclusions" | "gallery">> & {
    hotels?: unknown;
    activities?: unknown;
    sections?: unknown;
    itinerary?: unknown;
    inclusions?: unknown;
    exclusions?: unknown;
    gallery?: unknown;
  },
): XsedDropDraft {
  return {
    ...EMPTY_XSED_DRAFT,
    ...partial,
    hotels: padHotels(partial.hotels),
    activities: padActivities(partial.activities as ActivityEntry[] | undefined),
    sections: padSections(Array.isArray(partial.sections) ? partial.sections : undefined),
    itinerary:
      Array.isArray(partial.itinerary) && partial.itinerary.length > 0
        ? (partial.itinerary as XsedDropDraft["itinerary"])
        : EMPTY_XSED_DRAFT.itinerary,
    inclusions: Array.isArray(partial.inclusions) ? (partial.inclusions as string[]) : [],
    exclusions: Array.isArray(partial.exclusions) ? (partial.exclusions as string[]) : [],
    gallery: Array.isArray(partial.gallery) ? (partial.gallery as string[]) : [],
  };
}
