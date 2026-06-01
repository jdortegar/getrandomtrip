export type XsedDropStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface XsedDropDraft {
  status: XsedDropStatus;
  titleInternal: string;
  teaser: string;
  heroImage: string;
  slug: string;
  tripDate: string; // ISO date "YYYY-MM-DD" (date input)
  revealAt: string; // ISO datetime (datetime-local input)
  maxSpots: number; // default 10
  minSpots: number; // default 2
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
  hotels: string; // JSON textarea (v1)
  activities: string; // JSON textarea (v1)
  adminNotes: string;
  supplierNotes: string;
}

export const EMPTY_XSED_DRAFT: XsedDropDraft = {
  status: "DRAFT",
  titleInternal: "",
  teaser: "",
  heroImage: "",
  slug: "",
  tripDate: "",
  revealAt: "",
  maxSpots: 10,
  minSpots: 2,
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
  hotels: "",
  activities: "",
  adminNotes: "",
  supplierNotes: "",
};
