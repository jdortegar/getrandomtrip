import { describe, expect, it } from "vitest";
import { getExperienceTypes } from "@/lib/constants/packages";
import { getBasePricePerPerson } from "@/lib/data/traveler-types";
import {
  getExperienceBasePricePerPerson,
  getExperienceBlogTravelTypes,
  isXsedExperience,
  normalizeExperienceClassification,
  isValidSharedExperienceClassification,
  XSED_EXPERIENCE_WHERE,
} from "../xsedExperience";

const types = ["couple", "family", "group", "solo", "honeymoon", "paws"];

describe("XSED experience classification", () => {
  it.each(["es", "en"])("offers only traveler types in %s", (locale) => {
    expect(getExperienceTypes(locale).map(({ value }) => value)).toEqual(types);
  });

  it.each(types.filter((type) => type !== "solo"))(
    "prices %s at the XSED flat rate without changing planner pricing",
    (type) => {
      expect(getExperienceBasePricePerPerson(type, "xsed")).toBe(250);
      expect(getBasePricePerPerson(type, "xsed")).toBe(0);
    },
  );

  it("prices solo at the XSED solo rate without changing planner pricing", () => {
    expect(getExperienceBasePricePerPerson("solo", "xsed")).toBe(350);
    expect(getBasePricePerPerson("solo", "xsed")).toBe(0);
  });

  it("preserves ordinary prices and rejects unknown traveler types", () => {
    expect(getExperienceBasePricePerPerson("solo", "essenza")).toBe(450);
    expect(getExperienceBasePricePerPerson("unknown", "xsed")).toBe(0);
    expect(getExperienceBasePricePerPerson("XSED", null)).toBe(250);
  });

  it("recognizes canonical and legacy drops, without treating ordinary levels as XSED", () => {
    expect(isXsedExperience({ type: ["family"], level: "xsed" })).toBe(true);
    expect(isXsedExperience({ type: ["XSED"], level: null })).toBe(true);
    expect(isXsedExperience({ type: ["couple"], level: "essenza" })).toBe(
      false,
    );
    expect(XSED_EXPERIENCE_WHERE).toEqual({
      OR: [{ level: "xsed" }, { type: { has: "XSED" } }],
    });
  });

  it("hydrates legacy classification without inventing missing traveler types", () => {
    expect(
      normalizeExperienceClassification({ type: ["XSED"], level: null }),
    ).toEqual({ type: [], level: "xsed" });
    expect(
      normalizeExperienceClassification({
        type: ["couple", "XSED", "family"],
        level: null,
      }),
    ).toEqual({ type: ["couple", "family"], level: "xsed" });
    expect(
      normalizeExperienceClassification({ type: ["XSED"], level: "essenza" }),
    ).toEqual({ type: [], level: "xsed" });
    expect(
      normalizeExperienceClassification({ type: ["solo"], level: null }),
    ).toEqual({ type: ["solo"], level: "essenza" });
  });

  it("requires an actual traveler type before a shared XSED save", () => {
    expect(
      isValidSharedExperienceClassification({
        type: ["couple", "family"],
        level: "xsed",
      }),
    ).toBe(true);
    for (const type of [[], ["XSED"], ["couple", "XSED"], ["unknown"]]) {
      expect(
        isValidSharedExperienceClassification({ type, level: "xsed" }),
      ).toBe(false);
    }
  });

  it("returns the experience's plain traveler types — XSED is now carried on BlogPost.level, not travelType", () => {
    const experience = { type: ["couple", "family"], level: "xsed" };
    expect(getExperienceBlogTravelTypes(experience)).toEqual([
      "couple",
      "family",
    ]);
    expect(experience.type).toEqual(["couple", "family"]);
  });
});
