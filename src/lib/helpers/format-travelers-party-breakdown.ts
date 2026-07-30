import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { PaxDetails } from "@/lib/types/PaxDetails";

function segment(
  one: string | undefined,
  many: string | undefined,
  n: number,
): string {
  const template = n === 1 ? one : many;
  return template?.replace("{count}", String(n)) ?? "";
}

export function formatTravelersPartyBreakdown(
  copy: Dictionary["journey"]["checkout"],
  details: PaxDetails,
): string {
  const { adults, minors, rooms } = details;
  const sep = copy.travelersBreakdownSeparator;
  const parts: string[] = [];
  if (adults > 0) {
    parts.push(
      segment(copy.travelersAdultsOne, copy.travelersAdultsMany, adults),
    );
  }
  if (minors > 0) {
    parts.push(
      segment(copy.travelersMinorsOne, copy.travelersMinorsMany, minors),
    );
  }
  if (rooms > 0) {
    parts.push(segment(copy.travelersRoomsOne, copy.travelersRoomsMany, rooms));
  }
  return parts.filter(Boolean).join(sep);
}

/** Copy shape for the journey/details "Travellers" substep summary line. */
export interface PaxSubstepBreakdownCopy {
  adultsOne: string;
  adultsMany: string;
  minorsOne: string;
  minorsMany: string;
  petsOne: string;
  petsMany: string;
  breakdownSeparator: string;
}

/**
 * Summary line for the journey/details "Travellers" substep dropdown
 * (adults / minors / pets — no rooms, unlike the checkout breakdown above).
 * Unlike formatTravelersPartyBreakdown, all three segments are always shown
 * (including at 0) since this is a live editable summary, not a compact tag.
 */
export function formatPaxSubstepSummary(
  copy: PaxSubstepBreakdownCopy,
  details: { adults: number; minors: number; pets: number },
): string {
  const { adults, minors, pets } = details;
  return [
    segment(copy.adultsOne, copy.adultsMany, adults),
    segment(copy.minorsOne, copy.minorsMany, minors),
    segment(copy.petsOne, copy.petsMany, pets),
  ].join(copy.breakdownSeparator);
}
