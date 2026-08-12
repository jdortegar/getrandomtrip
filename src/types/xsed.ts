import type { AccommodationEntry, ActivityEntry, ItineraryDayEntry } from "@/types/tripper";

export type { AccommodationEntry, ActivityEntry, ItineraryDayEntry };
export type XsedDropStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface XsedSectionPhoto {
  url: string;
  /** Freeform "PH by ..." caption — no photographer directory exists. */
  credit: string;
}

export interface XsedSection {
  title: string;
  body: string; // HTML from RichTextInput
  photos: XsedSectionPhoto[];
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
  /** Repeatable narrative sections rendered on the public drop page. */
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

export const EMPTY_XSED_DRAFT: XsedDropDraft = {
  status: "DRAFT",
  titleInternal: "",
  heroImage: "",
  tripDate: "",
  destinationCity: "",
  destinationCountry: "",
  hotels: [{ hotelName: "", hotelStars: "", hotelLocation: "", hotelDays: "", hotelLink: "", referredLink: "" }],
  activities: [{ name: "", durationRhythm: null, description: "", risks: "", image: null }],
  sections: [{ title: "", body: "", photos: [] }],
  gallery: [],
  itinerary: [{ title: "", description: "", image: null }],
  inclusions: [],
  exclusions: [],
};
