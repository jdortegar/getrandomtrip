import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAX_DETAILS,
  getDefaultPaxDetailsForTravelType,
  getFixedPaxDetailsForTravelType,
  getPaxSubstepFields,
  hasPaxSubstep,
  isTravelersPartyEditable,
  parsePaxDetails,
  paxDetailsEquals,
} from "@/lib/helpers/pax-details";

describe("getDefaultPaxDetailsForTravelType", () => {
  it("returns 3 adults / 0 minors / 1 room / 0 pets for group", () => {
    expect(getDefaultPaxDetailsForTravelType("group")).toEqual({
      adults: 3,
      minors: 0,
      rooms: 1,
      pets: 0,
    });
  });

  it("returns 2 adults / 1 minor / 1 room / 0 pets for family", () => {
    expect(getDefaultPaxDetailsForTravelType("family")).toEqual({
      adults: 2,
      minors: 1,
      rooms: 1,
      pets: 0,
    });
  });

  it("returns 1 adult / 0 minors / 1 room / 1 pet for paws", () => {
    expect(getDefaultPaxDetailsForTravelType("paws")).toEqual({
      adults: 1,
      minors: 0,
      rooms: 1,
      pets: 1,
    });
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(getDefaultPaxDetailsForTravelType(" GROUP ")).toEqual({
      adults: 3,
      minors: 0,
      rooms: 1,
      pets: 0,
    });
  });

  it("falls back to DEFAULT_PAX_DETAILS for any other travel type", () => {
    expect(getDefaultPaxDetailsForTravelType("solo")).toBe(DEFAULT_PAX_DETAILS);
    expect(getDefaultPaxDetailsForTravelType("couple")).toBe(
      DEFAULT_PAX_DETAILS,
    );
    expect(getDefaultPaxDetailsForTravelType("honeymoon")).toBe(
      DEFAULT_PAX_DETAILS,
    );
  });
});

describe("getFixedPaxDetailsForTravelType (regression: group unlocked)", () => {
  it("returns null for group — group is now editable, no longer locked to 3 adults", () => {
    expect(getFixedPaxDetailsForTravelType("group")).toBeNull();
  });

  it("still locks solo and couple", () => {
    expect(getFixedPaxDetailsForTravelType("solo")).toEqual({
      adults: 1,
      minors: 0,
      rooms: 1,
    });
    expect(getFixedPaxDetailsForTravelType("couple")).toEqual({
      adults: 2,
      minors: 0,
      rooms: 1,
    });
  });
});

describe("isTravelersPartyEditable (regression: group unlocked)", () => {
  it("is true for group now (was false before this change)", () => {
    expect(isTravelersPartyEditable("group")).toBe(true);
  });

  it("is still false for solo and couple", () => {
    expect(isTravelersPartyEditable("solo")).toBe(false);
    expect(isTravelersPartyEditable("couple")).toBe(false);
  });
});

describe("parsePaxDetails with optional pets", () => {
  it("parses pets when present", () => {
    expect(parsePaxDetails({ adults: 2, minors: 1, rooms: 1, pets: 3 })).toEqual(
      { adults: 2, minors: 1, rooms: 1, pets: 3 },
    );
  });

  it("defaults pets to 0 when the key is entirely absent (backward-compat with old persisted JSON)", () => {
    expect(parsePaxDetails({ adults: 2, minors: 0, rooms: 1 })).toEqual({
      adults: 2,
      minors: 0,
      rooms: 1,
      pets: 0,
    });
  });

  it("defaults pets to 0 when present but invalid (negative or non-numeric)", () => {
    expect(
      parsePaxDetails({ adults: 1, minors: 0, rooms: 1, pets: -2 }),
    ).toEqual({ adults: 1, minors: 0, rooms: 1, pets: 0 });
    expect(
      parsePaxDetails({ adults: 1, minors: 0, rooms: 1, pets: "abc" }),
    ).toEqual({ adults: 1, minors: 0, rooms: 1, pets: 0 });
  });

  it("still rejects the whole object when adults/minors/rooms are invalid", () => {
    expect(parsePaxDetails({ adults: 0, minors: 0, rooms: 1 })).toBeNull();
    expect(parsePaxDetails(null)).toBeNull();
  });
});

describe("hasPaxSubstep", () => {
  it("is true for group, family, and paws (case-insensitive, trimmed)", () => {
    expect(hasPaxSubstep("group")).toBe(true);
    expect(hasPaxSubstep(" Family ")).toBe(true);
    expect(hasPaxSubstep("PAWS")).toBe(true);
  });

  it("is false for every other travel type, undefined, and empty string", () => {
    expect(hasPaxSubstep("solo")).toBe(false);
    expect(hasPaxSubstep("couple")).toBe(false);
    expect(hasPaxSubstep("honeymoon")).toBe(false);
    expect(hasPaxSubstep(undefined)).toBe(false);
    expect(hasPaxSubstep(null)).toBe(false);
    expect(hasPaxSubstep("")).toBe(false);
  });
});

describe("getPaxSubstepFields", () => {
  it("returns 'adults-minors' for group and family — they show Adults + Minors, no Pets field", () => {
    expect(getPaxSubstepFields("group")).toBe("adults-minors");
    expect(getPaxSubstepFields("family")).toBe("adults-minors");
  });

  it("returns 'adults-pets' for paws — it shows Adults + Pets, no Minors field", () => {
    expect(getPaxSubstepFields("paws")).toBe("adults-pets");
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(getPaxSubstepFields(" GROUP ")).toBe("adults-minors");
    expect(getPaxSubstepFields(" Paws ")).toBe("adults-pets");
  });

  it("returns null for every other travel type, undefined, null, and empty string", () => {
    expect(getPaxSubstepFields("solo")).toBeNull();
    expect(getPaxSubstepFields("couple")).toBeNull();
    expect(getPaxSubstepFields("honeymoon")).toBeNull();
    expect(getPaxSubstepFields(undefined)).toBeNull();
    expect(getPaxSubstepFields(null)).toBeNull();
    expect(getPaxSubstepFields("")).toBeNull();
  });
});

describe("paxDetailsEquals with optional pets", () => {
  it("treats undefined pets as 0 on both sides", () => {
    expect(
      paxDetailsEquals(
        { adults: 2, minors: 0, rooms: 1 },
        { adults: 2, minors: 0, rooms: 1, pets: 0 },
      ),
    ).toBe(true);
  });

  it("returns false when pets differ", () => {
    expect(
      paxDetailsEquals(
        { adults: 2, minors: 0, rooms: 1, pets: 1 },
        { adults: 2, minors: 0, rooms: 1, pets: 2 },
      ),
    ).toBe(false);
  });
});
