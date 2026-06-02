import type { AccommodationEntry, ActivityEntry } from "@/types/tripper";

export type { AccommodationEntry, ActivityEntry };
export type XsedDropStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface XsedDropDraft {
  status: XsedDropStatus;
  titleInternal: string;
  teaser: string;
  heroImage: string;
  tripDate: string; // ISO date "YYYY-MM-DD" (date input)
  basePrice: number; // default 250 (USD)
  isFeatured: boolean;
  destinationCity: string;
  destinationCountry: string;
  preRevealCopy: string;
  revealCopy: string;
  packingHints: string;
  accessibilityNotes: string;
  safetyNotes: string;
  cancellationPolicy: string;
  weatherPolicy: string;
  whatsappMessageTemplate: string;
  accommodationType: string;
  hotels: AccommodationEntry[];
  activities: ActivityEntry[];
  adminNotes: string;
  supplierNotes: string;
}

export const EMPTY_XSED_DRAFT: XsedDropDraft = {
  status: "DRAFT",
  titleInternal: "",
  teaser: "",
  heroImage: "",
  tripDate: "",
  basePrice: 250,
  isFeatured: false,
  destinationCity: "",
  destinationCountry: "",
  preRevealCopy: "",
  revealCopy: "",
  packingHints: "",
  accessibilityNotes: "",
  safetyNotes: "",
  cancellationPolicy: "",
  weatherPolicy: "",
  whatsappMessageTemplate: "",
  accommodationType: "any",
  hotels: [{ hotelName: "", hotelStars: "", hotelLocation: "", hotelDays: "" }],
  activities: [{ name: "", durationRhythm: "", description: "", risks: "" }],
  adminNotes: "",
  supplierNotes: "",
};
