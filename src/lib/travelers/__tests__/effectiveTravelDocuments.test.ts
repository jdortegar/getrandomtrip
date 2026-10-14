import { describe, expect, it } from "vitest";

import {
  effectiveTravelDocuments,
  PROFILE_DOCUMENTS_SELECT,
  profileTravelDocuments,
} from "../effectiveTravelDocuments";

const profile = (overrides: Partial<{
  nationalities: string[];
  approvedVisas: string[];
  passportCountry: string | null;
}> = {}) => ({
  nationalities: ["AR", "CO"],
  approvedVisas: ["US"],
  passportCountry: null,
  ...overrides,
});

describe("profileTravelDocuments", () => {
  it("returns the profile codes, converting legacy visa names", () => {
    expect(
      profileTravelDocuments(profile({ approvedVisas: ["United States", "Schengena"] })),
    ).toEqual({ nationalities: ["AR", "CO"], visas: ["US", "SCHENGEN"] });
  });

  it("prefills empty nationalities from a resolvable passport country", () => {
    expect(
      profileTravelDocuments(profile({ nationalities: [], passportCountry: "Argentina" })),
    ).toEqual({ nationalities: ["AR"], visas: ["US"] });
  });

  it("keeps saved nationalities over the passport country", () => {
    expect(
      profileTravelDocuments(profile({ nationalities: ["IT"], passportCountry: "Argentina" })),
    ).toEqual({ nationalities: ["IT"], visas: ["US"] });
  });

  it("returns empty lists without nationalities or a resolvable passport", () => {
    expect(
      profileTravelDocuments(profile({ nationalities: [], approvedVisas: [], passportCountry: "Nowhere" })),
    ).toEqual({ nationalities: [], visas: [] });
  });

  it("selects exactly the profile fields it reads", () => {
    expect(PROFILE_DOCUMENTS_SELECT).toEqual({
      nationalities: true,
      approvedVisas: true,
      passportCountry: true,
    });
  });
});

describe("effectiveTravelDocuments", () => {
  const row = { nationalities: ["FR"], visas: ["GB"] };

  it("reads a linked traveler's documents live from their profile", () => {
    expect(effectiveTravelDocuments({ user: profile(), row })).toEqual({
      nationalities: ["AR", "CO"],
      visas: ["US"],
    });
  });

  it("ignores the trip row for a linked traveler even when the profile is empty", () => {
    expect(
      effectiveTravelDocuments({
        user: profile({ nationalities: [], approvedVisas: [] }),
        row,
      }),
    ).toEqual({ nationalities: [], visas: [] });
  });

  it("reads an unlinked traveler's documents from the trip row", () => {
    expect(effectiveTravelDocuments({ user: null, row })).toEqual(row);
    expect(effectiveTravelDocuments({ row })).toEqual(row);
  });

  it("treats missing row lists as empty", () => {
    expect(effectiveTravelDocuments({ user: null, row: {} })).toEqual({
      nationalities: [],
      visas: [],
    });
  });
});
