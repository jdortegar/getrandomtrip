import { describe, it, expect } from "vitest";
import { computeChangedFields } from "../changed-fields";

describe("computeChangedFields", () => {
  const base = {
    title: "Test Experience",
    teaser: "A teaser",
    description: "Full description",
    type: ["couple"],
    level: "essenza",
    heroImage: "https://example.com/hero.jpg",
    tags: ["adventure"],
    destinationCountry: "Argentina",
    destinationCity: "Buenos Aires",
    excuseKey: ["escapada-romantica"],
    minNights: 2,
    maxNights: 5,
    minPax: 1,
    maxPax: 4,
    pricingByType: { couple: 200 },
    hotels: [{ name: "Hotel Test", stars: 4 }],
    activities: [{ name: "Kayak" }],
    itinerary: [{ day: 1, title: "Day 1", description: "Arrive" }],
    inclusions: ["Breakfast"],
    exclusions: ["Flights"],
    accommodationType: "hotel-style",
    transport: "plane",
    climate: "warm",
    maxTravelTime: "5h",
    departPref: "morning",
    arrivePref: "any",
    season: ["Alta"],
    highlights: ["Amazing views"],
    titleInternal: null,
    tripDate: null,
    revealAt: null,
    minSpots: null,
    maxSpots: null,
    cancellationPolicy: null,
    weatherPolicy: null,
    accessibilityNotes: null,
    safetyNotes: null,
    revealCopy: null,
    preRevealCopy: null,
    packingHints: null,
    whatsappMessageTemplate: null,
    adminNotes: null,
    supplierNotes: null,
  };

  it("returns empty array when copy and original are identical", () => {
    const result = computeChangedFields({ ...base }, { ...base });
    expect(result).toEqual([]);
  });

  it("detects scalar field change (title)", () => {
    const copy = { ...base, title: "New Title" };
    const result = computeChangedFields(copy, base);
    expect(result).toContain("title");
    expect(result).not.toContain("teaser");
  });

  it("detects JSON field change (hotels)", () => {
    const copy = { ...base, hotels: [{ name: "Different Hotel", stars: 5 }] };
    const result = computeChangedFields(copy, base);
    expect(result).toContain("hotels");
  });

  it("does NOT flag JSON field as changed when content is deeply equal", () => {
    const copy = { ...base, hotels: [{ name: "Hotel Test", stars: 4 }] };
    const result = computeChangedFields(copy, base);
    expect(result).not.toContain("hotels");
  });

  it("detects array field change (type)", () => {
    const copy = { ...base, type: ["couple", "group"] };
    const result = computeChangedFields(copy, base);
    expect(result).toContain("type");
  });

  it("does NOT flag array field as changed when arrays are equal", () => {
    const copy = { ...base, tags: ["adventure"] };
    const result = computeChangedFields(copy, base);
    expect(result).not.toContain("tags");
  });

  it("detects pricingByType JSON change", () => {
    const copy = { ...base, pricingByType: { couple: 300 } };
    const result = computeChangedFields(copy, base);
    expect(result).toContain("pricingByType");
  });

  it("detects multiple fields changed simultaneously", () => {
    const copy = {
      ...base,
      title: "Changed Title",
      description: "Changed description",
      heroImage: "https://example.com/new-hero.jpg",
    };
    const result = computeChangedFields(copy, base);
    expect(result).toContain("title");
    expect(result).toContain("description");
    expect(result).toContain("heroImage");
  });

  it("returns all mutable fields when everything is changed", () => {
    const different = {
      title: "X",
      teaser: "X",
      description: "X",
      type: ["group"],
      level: "bivouac",
      heroImage: "https://other.com/img.jpg",
      tags: ["cultural"],
      destinationCountry: "Chile",
      destinationCity: "Santiago",
      excuseKey: ["duo-aventura"],
      minNights: 3,
      maxNights: 7,
      minPax: 2,
      maxPax: 6,
      pricingByType: { group: 500 },
      hotels: [{ name: "Other Hotel" }],
      activities: [{ name: "Hiking" }],
      itinerary: [{ day: 1, title: "Different", description: "Different" }],
      inclusions: ["Lunch"],
      exclusions: ["Tips"],
      accommodationType: "glamping",
      transport: "bus",
      climate: "cold",
      maxTravelTime: "8h",
      departPref: "afternoon",
      arrivePref: "morning",
      season: ["Baja"],
      highlights: ["Other highlight"],
      titleInternal: "Internal",
      tripDate: "2025-01-01",
      revealAt: "2025-01-02",
      minSpots: 5,
      maxSpots: 20,
      cancellationPolicy: "Strict",
      weatherPolicy: "No refund",
      accessibilityNotes: "Stairs",
      safetyNotes: "Helmet required",
      revealCopy: "Reveal text",
      preRevealCopy: "Pre reveal text",
      packingHints: "Pack light",
      whatsappMessageTemplate: "Hello!",
      adminNotes: "Check this",
      supplierNotes: "Contact supplier",
    };
    const result = computeChangedFields(different, base);
    expect(result.length).toBeGreaterThan(10);
  });

  it("treats null and undefined as equivalent (no false positive)", () => {
    const copy = { ...base, cancellationPolicy: undefined };
    const original = { ...base, cancellationPolicy: null };
    const result = computeChangedFields(copy, original);
    expect(result).not.toContain("cancellationPolicy");
  });
});
