import { describe, expect, it } from "vitest";
import {
  getNextTab,
  isJourneyComplete,
  type JourneyStepValues,
} from "@/lib/helpers/journey";

const baseValues: JourneyStepValues = {
  travelType: "family",
  experience: "comfort",
  excuse: undefined,
  refineDetails: [],
  hasExcuseStep: false,
  effectiveOriginCountry: "Argentina",
  effectiveOriginCity: "Buenos Aires",
  effectiveStartDate: "2026-08-01",
  effectiveNights: 5,
  transport: "flight",
};

describe("getNextTab", () => {
  it("treats preferences as the final tab without an excuse step", () => {
    expect(getNextTab("budget", false)).toBe("details");
    expect(getNextTab("details", false)).toBe("preferences");
    expect(getNextTab("preferences", false)).toBeNull();
  });

  it("treats preferences as the final tab with an excuse step", () => {
    expect(getNextTab("budget", true)).toBe("excuse");
    expect(getNextTab("excuse", true)).toBe("details");
    expect(getNextTab("details", true)).toBe("preferences");
    expect(getNextTab("preferences", true)).toBeNull();
  });
});

describe("isJourneyComplete", () => {
  it("is false while still on the details tab, even if transport is already set", () => {
    // Regression test: transport is collected as a substep of "details" (Origin/Dates/Transport).
    // Filling it in must not surface Checkout before the user has ever reached "preferences",
    // the actual last tab.
    expect(isJourneyComplete("details", baseValues)).toBe(false);
  });

  it("is true once the user is on preferences and its own requirement is met", () => {
    expect(isJourneyComplete("preferences", baseValues)).toBe(true);
  });

  it("is false on preferences if its own requirement (transport) is missing", () => {
    expect(
      isJourneyComplete("preferences", {
        ...baseValues,
        transport: undefined,
      }),
    ).toBe(false);
  });

  it("does not flip early on excuse or details tabs when hasExcuseStep is true", () => {
    const withExcuse: JourneyStepValues = {
      ...baseValues,
      hasExcuseStep: true,
      excuse: "lost-a-bet",
      refineDetails: ["surprise-me"],
    };
    expect(isJourneyComplete("excuse", withExcuse)).toBe(false);
    expect(isJourneyComplete("details", withExcuse)).toBe(false);
    expect(isJourneyComplete("preferences", withExcuse)).toBe(true);
  });
});
