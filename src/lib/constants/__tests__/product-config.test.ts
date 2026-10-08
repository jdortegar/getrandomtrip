import { describe, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import {
  LEVEL_IDS_WITH_EXCUSE,
  MAX_REFINE_DETAILS,
  XSED_LEVEL_ID,
  hasExcuseStep,
} from "@/lib/constants/product-config";

const ELIGIBLE_TYPES = ["couple", "solo", "family", "group", "paws"];

describe("hasExcuseStep", () => {
  it.each(ELIGIBLE_TYPES)("is true for every level of %s", (type) => {
    for (const level of LEVEL_IDS_WITH_EXCUSE) {
      expect(hasExcuseStep(type, level)).toBe(true);
    }
  });

  it("normalizes level aliases", () => {
    expect(hasExcuseStep("solo", "Explora+")).toBe(true);
    expect(hasExcuseStep("solo", "modoexplora")).toBe(true);
  });

  it("is false for atelier", () => {
    for (const type of ELIGIBLE_TYPES) {
      expect(hasExcuseStep(type, "atelier-getaway")).toBe(false);
      expect(hasExcuseStep(type, "atelier")).toBe(false);
    }
  });

  it("is false for honeymoon at every level", () => {
    for (const level of [...LEVEL_IDS_WITH_EXCUSE, XSED_LEVEL_ID]) {
      expect(hasExcuseStep("honeymoon", level)).toBe(false);
    }
  });

  it("is false without a level or for unknown types and levels", () => {
    expect(hasExcuseStep("solo", null)).toBe(false);
    expect(hasExcuseStep("solo", "unknown-level")).toBe(false);
    expect(hasExcuseStep("unknown", "bivouac")).toBe(false);
  });

  it("shows for xsed bookings of eligible traveler types only", () => {
    for (const type of ELIGIBLE_TYPES) {
      expect(hasExcuseStep(type, XSED_LEVEL_ID)).toBe(true);
    }
    expect(hasExcuseStep("honeymoon", XSED_LEVEL_ID)).toBe(false);
    expect(hasExcuseStep("xsed", XSED_LEVEL_ID)).toBe(false);
  });
});

describe("MAX_REFINE_DETAILS", () => {
  it("is 3", () => {
    expect(MAX_REFINE_DETAILS).toBe(3);
  });

  it.each([
    ["en", en],
    ["es", es],
  ])("states the limit in the %s refine-details copy", (_locale, dict) => {
    const excuseTab = dict.journey.contentTabs.find((t) => t.id === "excuse");
    const substep = excuseTab?.substeps?.find((s) => s.id === "refine-details");
    expect(substep?.description).toContain(String(MAX_REFINE_DETAILS));
    expect(dict.journey.mainContent.refineDetailsStepDescription).toContain(
      String(MAX_REFINE_DETAILS),
    );
  });
});
