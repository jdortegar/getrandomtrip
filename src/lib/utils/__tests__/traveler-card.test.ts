import { describe, expect, it } from "vitest";
import {
  filterCarouselCards,
  isTypeOffered,
  resolveCarouselCardHref,
  type TravelerTypeCardData,
} from "../traveler-card";

const CARDS: TravelerTypeCardData[] = [
  { img: "/couple.jpg", key: "couple", subtitle: "Couple sub", title: "Couple" },
  { img: "/honeymoon.jpg", key: "honeymoon", subtitle: "Honeymoon sub", title: "Honeymoon" },
  { img: "/solo.jpg", key: "solo", subtitle: "Solo sub", title: "Solo" },
];

describe("filterCarouselCards (flag, never drop — design 'traveler-card.ts' interface)", () => {
  it("non-tripper context: every card is flagged availableFromTripper: true, regardless of availableTypes", () => {
    const result = filterCarouselCards(CARDS, { tripperContext: false });
    expect(result).toHaveLength(CARDS.length);
    expect(result.every((c) => c.availableFromTripper === true)).toBe(true);
  });

  it("non-tripper context with availableTypes set still flags everything true (identity behaviour preserved)", () => {
    const result = filterCarouselCards(CARDS, {
      tripperContext: false,
      availableTypes: ["couple"],
    });
    expect(result.every((c) => c.availableFromTripper === true)).toBe(true);
    expect(result).toHaveLength(CARDS.length);
  });

  it("tripper context with empty/undefined availableTypes: every card flagged false, list is not dropped", () => {
    const result = filterCarouselCards(CARDS, { tripperContext: true });
    expect(result).toHaveLength(CARDS.length);
    expect(result.every((c) => c.availableFromTripper === false)).toBe(true);
  });

  it("tripper context with mixed availableTypes: flags per-card, case-insensitively, never drops a card", () => {
    const result = filterCarouselCards(CARDS, {
      tripperContext: true,
      availableTypes: ["Couple", "solo"],
    });
    expect(result).toHaveLength(CARDS.length);
    const byKey = Object.fromEntries(result.map((c) => [c.key, c.availableFromTripper]));
    expect(byKey.couple).toBe(true);
    expect(byKey.honeymoon).toBe(false);
    expect(byKey.solo).toBe(true);
  });

  it("preserves original card fields alongside the new flag", () => {
    const [first] = filterCarouselCards(CARDS, { tripperContext: false });
    expect(first).toMatchObject(CARDS[0]);
  });
});

describe("isTypeOffered (review finding #1 — single normalized comparison shared by carousel + by-type page)", () => {
  it("resolves mixed-case allowedTypes against a lowercase slug the same way filterCarouselCards does", () => {
    const allowedTypes = ["XSED", "Couple"];
    expect(isTypeOffered(allowedTypes, "couple")).toBe(true);

    const filtered = filterCarouselCards(CARDS, {
      tripperContext: true,
      availableTypes: allowedTypes,
    });
    const byKey = Object.fromEntries(filtered.map((c) => [c.key, c.availableFromTripper]));
    expect(byKey.couple).toBe(true);
  });

  it("returns false for a type not in allowedTypes", () => {
    expect(isTypeOffered(["couple"], "honeymoon")).toBe(false);
  });

  it("treats missing/empty allowedTypes as not offered", () => {
    expect(isTypeOffered(undefined, "couple")).toBe(false);
    expect(isTypeOffered([], "couple")).toBe(false);
  });
});

describe("resolveCarouselCardHref (design ADR-8 href table)", () => {
  it("comingSoon -> undefined, regardless of availability or tripperSlug", () => {
    expect(
      resolveCarouselCardHref("family", {
        isComingSoon: true,
        availableFromTripper: true,
        tripperSlug: "maria",
      }),
    ).toBeUndefined();
    expect(
      resolveCarouselCardHref("family", {
        isComingSoon: true,
        availableFromTripper: false,
      }),
    ).toBeUndefined();
  });

  it("available + tripperSlug -> /experiences/by-type/{slug}?tripper={tripperSlug}", () => {
    expect(
      resolveCarouselCardHref("couple", {
        isComingSoon: false,
        availableFromTripper: true,
        tripperSlug: "maria",
      }),
    ).toBe("/experiences/by-type/couple?tripper=maria");
  });

  it("available + no tripperSlug -> plain /experiences/by-type/{slug}", () => {
    expect(
      resolveCarouselCardHref("couple", {
        isComingSoon: false,
        availableFromTripper: true,
      }),
    ).toBe("/experiences/by-type/couple");
  });

  it("unavailable (tripper context) -> /experiences/by-type/{slug}?catalog=randomtrip, even with a tripperSlug present", () => {
    expect(
      resolveCarouselCardHref("honeymoon", {
        isComingSoon: false,
        availableFromTripper: false,
        tripperSlug: "maria",
      }),
    ).toBe("/experiences/by-type/honeymoon?catalog=randomtrip");
  });

  it("encodes the tripperSlug in the query string", () => {
    expect(
      resolveCarouselCardHref("couple", {
        isComingSoon: false,
        availableFromTripper: true,
        tripperSlug: "maría gómez",
      }),
    ).toBe("/experiences/by-type/couple?tripper=mar%C3%ADa%20g%C3%B3mez");
  });
});
