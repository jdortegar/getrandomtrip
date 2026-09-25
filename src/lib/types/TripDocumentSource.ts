import type { DocumentProviderCandidate } from "./DocumentProviderCandidate";

export interface ExperienceItinerary {
  title: string;
  itinerary: unknown;
  inclusions: unknown;
  exclusions: unknown;
}

export interface TripDocumentSourceContext {
  experienceItinerary: ExperienceItinerary | null;
  candidates: Record<
    "hotel" | "activity" | "dinner",
    DocumentProviderCandidate[]
  >;
}

export interface TripDocumentSourceSelection {
  key: string;
  experienceId?: string | null;
  context: TripDocumentSourceContext | null;
  status: "loading" | "ready" | "error";
  retry: () => void;
}
