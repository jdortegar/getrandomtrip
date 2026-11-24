"use client";

import dynamic from "next/dynamic";
import SecureRoute from "@/components/auth/SecureRoute";
import { TripItineraryContent } from "@/components/app/dashboard/traveler/TripItineraryContent";

// Client-only: the reveal gate reads localStorage ("already seen") on mount.
const DestinationContent = dynamic(() => Promise.resolve(TripItineraryContent), {
  ssr: false,
});

/**
 * The revealed destination: reveal gate (once per browser), destination
 * hero, guide, itinerary and documents. Unrevealed trips are sent back to
 * the trip-details page, which shows the countdown.
 */
export default function TripDestinationPage() {
  return (
    <SecureRoute>
      <DestinationContent />
    </SecureRoute>
  );
}
