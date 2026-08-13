import { describe, expect, it } from "vitest";
import { buildDayDateLabels, resolveTripDestination, resolveTripOrigin } from "../tripDetailsHelpers";

const FALLBACK = "Your destination, revealed";

describe("resolveTripDestination", () => {
  it("prefers actualDestination when present", () => {
    const trip = {
      actualDestination: "Mendoza, Argentina",
      experience: {
        destinationCity: "Cancun",
        destinationCountry: "Mexico",
        title: "Riviera Maya Escape",
      },
    };
    expect(resolveTripDestination(trip, FALLBACK)).toBe("Mendoza, Argentina");
  });

  it("falls back to experience city + country when actualDestination is null", () => {
    const trip = {
      actualDestination: null,
      experience: {
        destinationCity: "Cartagena",
        destinationCountry: "Colombia",
        title: "Caribbean Reveal",
      },
    };
    expect(resolveTripDestination(trip, FALLBACK)).toBe("Cartagena, Colombia");
  });

  it("falls back to city alone when country is null", () => {
    const trip = {
      actualDestination: null,
      experience: {
        destinationCity: "Salta",
        destinationCountry: null,
        title: "Andes Getaway",
      },
    };
    expect(resolveTripDestination(trip, FALLBACK)).toBe("Salta");
  });

  it("falls back to experience.title when city and country are both null", () => {
    const trip = {
      actualDestination: null,
      experience: {
        destinationCity: null,
        destinationCountry: null,
        title: "Andes Getaway",
      },
    };
    expect(resolveTripDestination(trip, FALLBACK)).toBe("Andes Getaway");
  });

  it("falls back to the provided fallback copy when everything is null/absent", () => {
    expect(resolveTripDestination({ actualDestination: null, experience: null }, FALLBACK)).toBe(
      FALLBACK,
    );
  });
});

describe("resolveTripOrigin", () => {
  it("joins originCity and originCountry", () => {
    expect(resolveTripOrigin({ originCity: "Buenos Aires", originCountry: "Argentina" })).toBe(
      "Buenos Aires, Argentina",
    );
  });
});

describe("buildDayDateLabels", () => {
  it("derives weekday/date for index 0 in en", () => {
    const result = buildDayDateLabels("2026-08-22T00:00:00.000Z", 0, "en");
    expect(result.weekday).toBe("Saturday");
    expect(result.date).toContain("Aug");
    expect(result.date).toContain("22");
  });

  it("derives weekday/date for a later index by adding days", () => {
    const result = buildDayDateLabels("2026-08-22T00:00:00.000Z", 2, "en");
    expect(result.weekday).toBe("Monday");
    expect(result.date).toContain("24");
  });

  it("derives a Spanish weekday for the es locale", () => {
    const result = buildDayDateLabels("2026-08-22T00:00:00.000Z", 0, "es");
    expect(result.weekday?.toLowerCase()).toContain("sábado");
  });

  it("returns null weekday/date when startDate is null", () => {
    const result = buildDayDateLabels(null, 0, "en");
    expect(result.weekday).toBeNull();
    expect(result.date).toBeNull();
  });
});
