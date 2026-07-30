import { describe, expect, it } from "vitest";
import {
  buildTripRequestPayloadFromSearchParams,
  filterContentTabsForUI,
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

describe("buildTripRequestPayloadFromSearchParams — pax fields", () => {
  it("(regression baseline) falls back to paxDetailsFromTotalPax(pax) for travel types outside this feature's scope", () => {
    const params = new URLSearchParams({
      travelType: "couple",
      originCountry: "Argentina",
      originCity: "Buenos Aires",
      pax: "2",
    });
    const payload = buildTripRequestPayloadFromSearchParams(params);
    expect(payload.pax).toBe(2);
    expect(payload.paxDetails).toEqual({ adults: 2, minors: 0, rooms: 1 });
  });

  it("(regression baseline) ignores paxAdults/paxMinors/paxPets for travel types outside scope", () => {
    const params = new URLSearchParams({
      travelType: "couple",
      originCountry: "Argentina",
      originCity: "Buenos Aires",
      pax: "2",
      paxAdults: "5",
      paxMinors: "2",
      paxPets: "1",
    });
    const payload = buildTripRequestPayloadFromSearchParams(params);
    expect(payload.pax).toBe(2);
    expect(payload.paxDetails).toEqual({ adults: 2, minors: 0, rooms: 1 });
  });

  it("reflects paxAdults/paxMinors/paxPets in the payload when present for group", () => {
    const params = new URLSearchParams({
      travelType: "group",
      originCountry: "Argentina",
      originCity: "Buenos Aires",
      paxAdults: "4",
      paxMinors: "1",
      paxPets: "2",
    });
    const payload = buildTripRequestPayloadFromSearchParams(params);
    expect(payload.paxDetails).toEqual({
      adults: 4,
      minors: 1,
      rooms: 1,
      pets: 2,
    });
    expect(payload.pax).toBe(5); // adults + minors, pets excluded from headcount
  });

  it("reflects paxAdults/paxMinors/paxPets in the payload when present for family", () => {
    const params = new URLSearchParams({
      travelType: "family",
      originCountry: "Argentina",
      originCity: "Buenos Aires",
      paxAdults: "2",
      paxMinors: "2",
      paxPets: "0",
    });
    const payload = buildTripRequestPayloadFromSearchParams(params);
    expect(payload.paxDetails).toEqual({
      adults: 2,
      minors: 2,
      rooms: 1,
      pets: 0,
    });
    expect(payload.pax).toBe(4);
  });

  it("reflects paxAdults/paxMinors/paxPets in the payload when present for paws", () => {
    const params = new URLSearchParams({
      travelType: "paws",
      originCountry: "Argentina",
      originCity: "Buenos Aires",
      paxAdults: "1",
      paxMinors: "0",
      paxPets: "1",
    });
    const payload = buildTripRequestPayloadFromSearchParams(params);
    expect(payload.paxDetails).toEqual({
      adults: 1,
      minors: 0,
      rooms: 1,
      pets: 1,
    });
    expect(payload.pax).toBe(1);
  });

  it("falls back to getDefaultPaxDetailsForTravelType for group/family/paws when pax params are absent", () => {
    const params = new URLSearchParams({
      travelType: "family",
      originCountry: "Argentina",
      originCity: "Buenos Aires",
    });
    const payload = buildTripRequestPayloadFromSearchParams(params);
    expect(payload.paxDetails).toEqual({
      adults: 2,
      minors: 1,
      rooms: 1,
      pets: 0,
    });
    expect(payload.pax).toBe(3);
  });
});

describe("filterContentTabsForUI", () => {
  const contentTabs = [
    { id: "budget", label: "Budget", substeps: [] },
    {
      id: "excuse",
      label: "Excuse",
      substeps: [{ id: "reason", title: "Reason", description: "d" }],
    },
    {
      id: "details",
      label: "Details",
      substeps: [
        { id: "pax", title: "Travellers", description: "d" },
        { id: "origin", title: "Origin", description: "d" },
        { id: "dates", title: "Dates", description: "d" },
        { id: "transport", title: "Transport", description: "d" },
      ],
    },
    { id: "preferences", label: "Preferences", substeps: [] },
  ];

  it("drops the excuse tab when hasExcuseStep is false", () => {
    const result = filterContentTabsForUI(contentTabs, {
      travelType: "couple",
      hasExcuseStep: false,
    });
    expect(result.map((t) => t.id)).toEqual(["budget", "details", "preferences"]);
  });

  it("keeps the excuse tab when hasExcuseStep is true", () => {
    const result = filterContentTabsForUI(contentTabs, {
      travelType: "couple",
      hasExcuseStep: true,
    });
    expect(result.map((t) => t.id)).toContain("excuse");
  });

  it("keeps the pax substep under details for group/family/paws", () => {
    for (const travelType of ["group", "family", "paws"]) {
      const result = filterContentTabsForUI(contentTabs, {
        travelType,
        hasExcuseStep: false,
      });
      const details = result.find((t) => t.id === "details");
      expect(details?.substeps.map((s) => s.id)).toEqual([
        "pax",
        "origin",
        "dates",
        "transport",
      ]);
    }
  });

  it("drops the pax substep under details for every other travel type", () => {
    for (const travelType of ["solo", "couple", "honeymoon", undefined, null]) {
      const result = filterContentTabsForUI(contentTabs, {
        travelType: travelType ?? undefined,
        hasExcuseStep: false,
      });
      const details = result.find((t) => t.id === "details");
      expect(details?.substeps.map((s) => s.id)).toEqual([
        "origin",
        "dates",
        "transport",
      ]);
    }
  });

  it("does not mutate tabs whose id is not 'details'", () => {
    const result = filterContentTabsForUI(contentTabs, {
      travelType: "solo",
      hasExcuseStep: true,
    });
    const excuseTab = result.find((t) => t.id === "excuse");
    expect(excuseTab?.substeps).toEqual(contentTabs[1].substeps);
  });
});
