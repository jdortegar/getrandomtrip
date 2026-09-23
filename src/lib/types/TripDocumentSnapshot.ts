import type { ActivityVoucherDocument } from "./ActivityVoucher";
import type { DinnerVoucherDocument } from "./DinnerVoucher";
import type { ExperienceRoadmapDocument } from "./ExperienceRoadmap";
import type { HotelVoucherDocument } from "./HotelVoucher";
import type { XsedRoadmapDocument } from "./XsedRoadmap";

export type TripDocumentSnapshot =
  | ActivityVoucherDocument
  | DinnerVoucherDocument
  | ExperienceRoadmapDocument
  | HotelVoucherDocument
  | XsedRoadmapDocument;

/** Creation-only source facts; traveler rows contain companions, not the buyer. */
export interface TripDocumentSnapshotSource {
  user?: { name?: string | null; locale?: string | null } | null;
  originCity?: string | null;
  actualDestination?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  pax?: number | null;
  travelers?: ReadonlyArray<{ fullName?: string | null }> | null;
  experience?: {
    title?: string | null;
    destinationCity?: string | null;
    destinationCountry?: string | null;
  } | null;
}
