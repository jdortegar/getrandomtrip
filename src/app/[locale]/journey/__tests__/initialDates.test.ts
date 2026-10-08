import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getInitialStepFromParams } from "../JourneyPageClient";
import { isSubstepValueComplete } from "@/lib/helpers/journey";
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-27T23:59:59Z"));
});
afterEach(() => vi.useRealTimers());
it.each(["2026-09-01", "2026-10-03", "2026-02-30"])(
  "reopens dates for stale or invalid URL %s",
  (startDate) => {
    const params = new URLSearchParams({
      travelType: "couple",
      // Atelier has no excuse step, so the date substep is the first gap.
      experience: "atelier-getaway",
      originCountry: "AR",
      originCity: "Origin",
      nights: "2",
      startDate,
      transportOrder: "bus,train,plane,ship",
    });
    expect(getInitialStepFromParams(params)).toEqual({
      tabId: "details",
      sectionId: "dates",
    });
    expect(
      isSubstepValueComplete("details", "dates", {
        travelType: "couple",
        refineDetails: [],
        originCountry: "AR",
        originCity: "Origin",
        nights: 2,
        startDate,
        transportOrder: [],
      }),
    ).toBe(false);
  },
);
