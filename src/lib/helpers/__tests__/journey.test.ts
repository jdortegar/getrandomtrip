import { describe, expect, it } from "vitest";
import {
  buildTripRequestPayloadFromSearchParams,
  filterContentTabsForUI,
  getNextTab,
  getPreviousTab,
  getTabSubstepOrder,
  getTravelTypeSelectionEffects,
  isStepComplete,
  isSubstepValueComplete,
  PARAMS_TO_RESET_AFTER_TRAVEL_TYPE,
  type JourneyStepValues,
  type SubstepCompletionContext,
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

describe("getPreviousTab", () => {
  it("treats budget as the first tab without an excuse step", () => {
    expect(getPreviousTab("budget", false)).toBeNull();
    expect(getPreviousTab("details", false)).toBe("budget");
    expect(getPreviousTab("preferences", false)).toBe("details");
  });

  it("treats budget as the first tab with an excuse step", () => {
    expect(getPreviousTab("budget", true)).toBeNull();
    expect(getPreviousTab("excuse", true)).toBe("budget");
    expect(getPreviousTab("details", true)).toBe("excuse");
    expect(getPreviousTab("preferences", true)).toBe("details");
  });

  it("is the exact inverse of getNextTab for every adjacent pair", () => {
    for (const hasExcuseStep of [true, false]) {
      const tabs = hasExcuseStep
        ? ["budget", "excuse", "details", "preferences"]
        : ["budget", "details", "preferences"];
      for (let i = 1; i < tabs.length; i++) {
        expect(getPreviousTab(tabs[i], hasExcuseStep)).toBe(tabs[i - 1]);
      }
    }
  });
});

describe("isStepComplete", () => {
  it("budget requires both travelType and experience", () => {
    expect(isStepComplete("budget", baseValues)).toBe(true);
    expect(
      isStepComplete("budget", { ...baseValues, experience: undefined }),
    ).toBe(false);
  });

  it("excuse requires excuse + at least one refineDetails only when hasExcuseStep is true", () => {
    expect(isStepComplete("excuse", baseValues)).toBe(true); // hasExcuseStep: false
    const withExcuseStep = { ...baseValues, hasExcuseStep: true };
    expect(isStepComplete("excuse", withExcuseStep)).toBe(false);
    expect(
      isStepComplete("excuse", { ...withExcuseStep, excuse: "celebration" }),
    ).toBe(false); // still missing refineDetails
    expect(
      isStepComplete("excuse", {
        ...withExcuseStep,
        excuse: "celebration",
        refineDetails: ["birthday"],
      }),
    ).toBe(true);
  });

  it("details requires origin + dates, NOT transport", () => {
    expect(isStepComplete("details", baseValues)).toBe(true);
    expect(
      isStepComplete("details", { ...baseValues, effectiveOriginCity: "" }),
    ).toBe(false);
  });

  it("preferences checks the (legacy, url-level) transport field", () => {
    expect(isStepComplete("preferences", baseValues)).toBe(true);
    expect(
      isStepComplete("preferences", { ...baseValues, transport: undefined }),
    ).toBe(false);
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

  it("reflects paxAdults/paxMinors in the payload for group, and zeroes pets (group has no Pets field)", () => {
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
      pets: 0,
    });
    expect(payload.pax).toBe(5); // adults + minors, pets excluded from headcount
  });

  it("reflects paxAdults/paxMinors in the payload for family, and zeroes pets (family has no Pets field)", () => {
    const params = new URLSearchParams({
      travelType: "family",
      originCountry: "Argentina",
      originCity: "Buenos Aires",
      paxAdults: "2",
      paxMinors: "2",
      paxPets: "3",
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

  it("reflects paxAdults/paxPets in the payload for paws, and zeroes minors (paws has no Minors field)", () => {
    const params = new URLSearchParams({
      travelType: "paws",
      originCountry: "Argentina",
      originCity: "Buenos Aires",
      paxAdults: "1",
      paxMinors: "5",
      paxPets: "1",
    });
    const payload = buildTripRequestPayloadFromSearchParams(params);
    expect(payload.paxDetails).toEqual({
      adults: 1,
      minors: 0,
      rooms: 1,
      pets: 1,
    });
    expect(payload.pax).toBe(1); // pets excluded, minors zeroed for paws
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

describe("getTravelTypeSelectionEffects", () => {
  // Regression test for: switching travel type while a non-"origin"
  // accordion section (e.g. "dates" or "transport") is open leaves the
  // accordion stuck on the stale section — origin/dates/transport params
  // get wiped by PARAMS_TO_RESET_AFTER_TRAVEL_TYPE, but "dates"/"transport"
  // remain *valid* accordion values for the "details" tab, so
  // useJourneyAccordion's tab-change effect (which only corrects *invalid*
  // values) never resets it. The accordion must be reset explicitly here.
  it("always resets the accordion back to 'origin', matching handleContinue's precedent for entering details", () => {
    const result = getTravelTypeSelectionEffects("couple", null);
    expect(result.accordionValue).toBe("origin");
  });

  it("resets it to 'pax' for travel types that seed pax defaults, since Travellers is the first substep for them", () => {
    const result = getTravelTypeSelectionEffects("group", {
      adults: 3,
      minors: 0,
      pets: 0,
    });
    expect(result.accordionValue).toBe("pax");
  });

  it("includes every PARAMS_TO_RESET_AFTER_TRAVEL_TYPE key plus the new travelType", () => {
    const result = getTravelTypeSelectionEffects("solo", null);
    expect(result.queryPatch).toEqual({
      ...PARAMS_TO_RESET_AFTER_TRAVEL_TYPE,
      travelType: "solo",
    });
  });

  it("seeds paxAdults/paxMinors/paxPets in the same patch when a paxSeed is given", () => {
    const result = getTravelTypeSelectionEffects("family", {
      adults: 2,
      minors: 1,
      pets: 0,
    });
    expect(result.queryPatch).toEqual({
      ...PARAMS_TO_RESET_AFTER_TRAVEL_TYPE,
      travelType: "family",
      paxAdults: "2",
      paxMinors: "1",
      paxPets: "0",
    });
  });

  it("defaults paxPets to '0' when paxSeed.pets is omitted", () => {
    const result = getTravelTypeSelectionEffects("paws", {
      adults: 1,
      minors: 0,
    });
    expect(result.queryPatch.paxPets).toBe("0");
  });

  it("does not seed pax params when paxSeed is null (they stay reset via PARAMS_TO_RESET_AFTER_TRAVEL_TYPE)", () => {
    const result = getTravelTypeSelectionEffects("couple", null);
    expect(result.queryPatch.paxAdults).toBeUndefined();
    expect(result.queryPatch.paxMinors).toBeUndefined();
    expect(result.queryPatch.paxPets).toBeUndefined();
  });
});

describe("getTabSubstepOrder", () => {
  it("orders budget as travel-type then experience", () => {
    expect(
      getTabSubstepOrder("budget", {
        hasExcuseStep: false,
        hasPax: false,
        addonsEnabled: false,
      }),
    ).toEqual(["travel-type", "experience"]);
  });

  it("orders excuse as reason then refine-details", () => {
    expect(
      getTabSubstepOrder("excuse", {
        hasExcuseStep: true,
        hasPax: false,
        addonsEnabled: false,
      }),
    ).toEqual(["reason", "refine-details"]);
  });

  it("puts pax first under details only when hasPax is true", () => {
    expect(
      getTabSubstepOrder("details", {
        hasExcuseStep: false,
        hasPax: true,
        addonsEnabled: false,
      }),
    ).toEqual(["pax", "origin", "dates", "transport"]);
    expect(
      getTabSubstepOrder("details", {
        hasExcuseStep: false,
        hasPax: false,
        addonsEnabled: false,
      }),
    ).toEqual(["origin", "dates", "transport"]);
  });

  it("includes addons under preferences only when addonsEnabled is true", () => {
    expect(
      getTabSubstepOrder("preferences", {
        hasExcuseStep: false,
        hasPax: false,
        addonsEnabled: true,
      }),
    ).toEqual(["filters", "addons"]);
    expect(
      getTabSubstepOrder("preferences", {
        hasExcuseStep: false,
        hasPax: false,
        addonsEnabled: false,
      }),
    ).toEqual(["filters"]);
  });

  it("returns an empty list for an unknown tab", () => {
    expect(
      getTabSubstepOrder("nonexistent", {
        hasExcuseStep: false,
        hasPax: false,
        addonsEnabled: false,
      }),
    ).toEqual([]);
  });
});

describe("isSubstepValueComplete", () => {
  const baseCtx: SubstepCompletionContext = {
    travelType: undefined,
    experience: undefined,
    excuse: undefined,
    refineDetails: [],
    originCountry: "",
    originCity: "",
    startDate: undefined,
    nights: 0,
    transportOrder: [],
  };

  it("blocks budget substeps until their own field is set", () => {
    expect(isSubstepValueComplete("budget", "travel-type", baseCtx)).toBe(false);
    expect(
      isSubstepValueComplete("budget", "travel-type", {
        ...baseCtx,
        travelType: "group",
      }),
    ).toBe(true);
    expect(isSubstepValueComplete("budget", "experience", baseCtx)).toBe(false);
    expect(
      isSubstepValueComplete("budget", "experience", {
        ...baseCtx,
        experience: "essenza",
      }),
    ).toBe(true);
  });

  it("blocks excuse substeps until reason/refine-details are set", () => {
    expect(isSubstepValueComplete("excuse", "reason", baseCtx)).toBe(false);
    expect(
      isSubstepValueComplete("excuse", "reason", {
        ...baseCtx,
        excuse: "celebration",
      }),
    ).toBe(true);
    expect(
      isSubstepValueComplete("excuse", "refine-details", baseCtx),
    ).toBe(false);
    expect(
      isSubstepValueComplete("excuse", "refine-details", {
        ...baseCtx,
        refineDetails: ["birthday"],
      }),
    ).toBe(true);
  });

  it("blocks details:origin/dates/transport until their own fields are set, independent of each other", () => {
    expect(isSubstepValueComplete("details", "origin", baseCtx)).toBe(false);
    expect(
      isSubstepValueComplete("details", "origin", {
        ...baseCtx,
        originCountry: "Argentina",
        originCity: "Buenos Aires",
      }),
    ).toBe(true);

    expect(isSubstepValueComplete("details", "dates", baseCtx)).toBe(false);
    expect(
      isSubstepValueComplete("details", "dates", {
        ...baseCtx,
        startDate: "2026-08-01",
        nights: 3,
      }),
    ).toBe(true);

    expect(isSubstepValueComplete("details", "transport", baseCtx)).toBe(
      false,
    );
    expect(
      isSubstepValueComplete("details", "transport", {
        ...baseCtx,
        transportOrder: ["bus", "train", "plane", "ship"],
      }),
    ).toBe(true);
  });

  it("never blocks details:pax, preferences:filters, or preferences:addons — they always have a valid default", () => {
    expect(isSubstepValueComplete("details", "pax", baseCtx)).toBe(true);
    expect(isSubstepValueComplete("preferences", "filters", baseCtx)).toBe(
      true,
    );
    expect(isSubstepValueComplete("preferences", "addons", baseCtx)).toBe(
      true,
    );
  });
});
