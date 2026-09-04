import type { AccommodationEntry, ActivityEntry, ItineraryDayEntry } from "@/types/tripper";

export type { AccommodationEntry, ActivityEntry, ItineraryDayEntry };
export type XsedDropStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface XsedSectionPhoto {
  url: string;
  /** Freeform "PH by ..." caption — no photographer directory exists. */
  credit: string;
}

export interface XsedContact {
  name: string;
  phone: string;
  address: string;
  /** Freeform text, e.g. "Check-in 15:00" — not a strict HH:MM value. */
  hour: string;
}

export interface XsedSection {
  title: string;
  body: string; // HTML from RichTextInput
  photos: XsedSectionPhoto[];
  /** On-the-ground contact for this item (hotel front desk, restaurant, activity operator). */
  contact: XsedContact;
}

export interface XsedDropDraft {
  status: XsedDropStatus;
  titleInternal: string;
  heroImage: string;
  tripDate: string; // ISO date "YYYY-MM-DD" (date input)
  destinationCity: string;
  destinationCountry: string;
  hotels: AccommodationEntry[];
  activities: ActivityEntry[];
  /**
   * Title/content/photos block for each fixed item, in lockstep with
   * `hotels`/`activities`: index 0 = accommodation, 1 = dinner, 2 = activity.
   * Rendered as narrative sections on the public drop page.
   */
  sections: XsedSection[];
  /** Public gallery image URLs (multi-upload grid). */
  gallery: string[];
  /**
   * Day-by-day itinerary, inclusions, and exclusions — read-only reference
   * content shown to the traveler once fulfillment-visible (design.md
   * ADR-6/ADR-7). XSED itinerary days carry no per-day image; `image` stays
   * `null` for shape parity with tripper experiences.
   */
  itinerary: ItineraryDayEntry[];
  inclusions: string[];
  exclusions: string[];
}

export const EMPTY_XSED_CONTACT: XsedContact = { name: "", phone: "", address: "", hour: "" };

export const EMPTY_XSED_SECTION: XsedSection = {
  title: "",
  body: "",
  photos: [],
  contact: { ...EMPTY_XSED_CONTACT },
};

/**
 * Normalizes a raw `sections` JSON entry read back from the DB into a full
 * `XsedSection` — a drop saved before `contact` (or `photos`) existed on
 * this type has neither key, and rendering `XsedContactFields` against a
 * missing `contact` throws at runtime. Always route DB-sourced sections
 * through this before handing them to `XsedDropShell`.
 */
export function normalizeXsedSection(raw: unknown): XsedSection {
  const r = (raw ?? {}) as Partial<XsedSection>;
  return {
    title: r.title ?? "",
    body: r.body ?? "",
    photos: Array.isArray(r.photos) ? r.photos : [],
    contact: { ...EMPTY_XSED_CONTACT, ...(r.contact ?? {}) },
  };
}

export const EMPTY_XSED_DRAFT: XsedDropDraft = {
  status: "DRAFT",
  titleInternal: "",
  heroImage: "",
  tripDate: "",
  destinationCity: "",
  destinationCountry: "",
  // XSED drops are always a single night — hotelDays is hardcoded rather
  // than exposed in the UI, in case the backend still expects a value.
  hotels: [{ hotelName: "", hotelStars: "", hotelLocation: "", hotelDays: "1", hotelLink: "", referredLink: "" }],
  activities: [
    { name: "", durationRhythm: null, description: "", risks: "", image: null },
    { name: "", durationRhythm: null, description: "", risks: "", image: null },
  ],
  sections: [
    { title: "", body: "", photos: [], contact: { ...EMPTY_XSED_CONTACT } },
    { title: "", body: "", photos: [], contact: { ...EMPTY_XSED_CONTACT } },
    { title: "", body: "", photos: [], contact: { ...EMPTY_XSED_CONTACT } },
  ],
  gallery: [],
  itinerary: [{ title: "", description: "", image: null }],
  inclusions: [],
  exclusions: [],
};
