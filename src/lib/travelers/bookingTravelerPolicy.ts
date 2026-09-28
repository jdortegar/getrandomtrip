import {
  computeTravelerCap,
  hasMissingTravelerDetails,
  type TravelerIdentity,
} from "./travelerPolicy";

/** Read-only summary; legacy bookings may have uncreated companion slots. */
export function summarizeCompanionDetails(
  travelers: TravelerIdentity[],
  pax: number,
  paxDetails: unknown,
) {
  const cap = computeTravelerCap(paxDetails);
  const expected = Math.max(cap.adultRows + cap.minorRows, pax - 1, 0);
  const incomplete = travelers.filter(hasMissingTravelerDetails).length;
  const missing = Math.max(0, expected - travelers.length);
  const materializable =
    travelers.length +
    Math.max(
      0,
      cap.adultRows - travelers.filter((row) => row.kind === "ADULT").length,
    ) +
    Math.max(
      0,
      cap.minorRows - travelers.filter((row) => row.kind === "MINOR").length,
    );
  const needsReminder = incomplete > 0 || missing > 0;
  return {
    expected,
    complete: travelers.length - incomplete,
    incomplete,
    missing,
    extra: Math.max(0, travelers.length - expected),
    needsReminder,
    // Saved rows remain editable without typed metadata. Only uncreated
    // slots require an adult/minor breakdown; never infer ages from headcount.
    rosterNeedsReview: needsReminder && materializable < expected,
  };
}
