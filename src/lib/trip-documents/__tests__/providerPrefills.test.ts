// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createPrefilledDocumentSnapshot as create } from "../providerSnapshots";
import type { DocumentPrefillSource } from "@/lib/types/DocumentProviderCandidate";
import { parseActivityVoucher } from "../parsers/activityVoucher";
import { parseDinnerVoucher } from "../parsers/dinnerVoucher";
import { parseExperienceRoadmap } from "../parsers/experienceRoadmap";
import { parseHotelVoucher } from "../parsers/hotelVoucher";
import { parseXsedRoadmap } from "../parsers/xsedRoadmap";

const parsers = {
  "xsed-roadmap": parseXsedRoadmap,
  "experience-roadmap": parseExperienceRoadmap,
  "hotel-voucher": parseHotelVoucher,
  "activity-voucher": parseActivityVoucher,
  "dinner-voucher": parseDinnerVoucher,
};
const source: DocumentPrefillSource = {
  kind: "xsed",
  hotels: [{ hotelName: "Hotel" }],
  activities: [
    { name: "Dinner", description: "Menu &amp; drinks" },
    { name: "Ride", description: "2 < 3 hills", risks: "Bring water" },
  ],
  sections: [
    { body: "<p>Ask for Ana</p>" },
    { body: "<p>Outdoor seating</p>" },
    { body: "<p>Café &amp; ride</p>" },
  ],
  itinerary: [
    { title: "Arrival", description: "<p>Head north</p>" },
    { title: "Walk", description: "<p>Río</p>" },
  ],
};

describe("creation-only provider prefills", () => {
  it("combines buyer defaults with an explicitly selected hotel", () => {
    const result = create(
      "hotel-voucher",
      { user: { name: "Ana", locale: "en" } },
      {
        kind: "experience",
        hotels: [{ name: "Hotel", location: "Street" }],
      },
      0,
    );
    expect(result.locale).toBe("en");
    expect(result.data).toMatchObject({
      holder: "Ana",
      property: { name: "Hotel", address: "Street" },
      checkInDate: "",
      checkOutDate: "",
      inclusions: [],
    });
  });
  it.each([undefined, 8, -1, "0"])(
    "does not prefill provider content without a valid explicit selection: %s",
    (index) => {
      expect(create("hotel-voucher", {}, source, index).data).toMatchObject({
        property: { name: "", address: "" },
      });
      expect(create("activity-voucher", {}, source, index).data).toMatchObject({
        provider: { name: "", address: "" },
        program: [],
      });
      expect(create("dinner-voucher", {}, source, index).data).toMatchObject({
        restaurant: { name: "", address: "" },
        service: "",
      });
    },
  );
  it("copies only selected XSED narrative and plain service facts", () => {
    expect(create("hotel-voucher", {}, source, 0).data).toMatchObject({
      instructions: "Ask for Ana",
      inclusions: [],
    });
    expect(create("activity-voucher", {}, source, 1).data).toMatchObject({
      provider: { name: "", address: "" },
      recommendations: "Bring water",
      program: [
        {
          id: "activity-1",
          title: "Ride",
          description: "2 < 3 hills\n\nCafé & ride",
        },
      ],
    });
    expect(create("dinner-voucher", {}, source, 0).data).toMatchObject({
      restaurant: { name: "", address: "" },
      service: "Dinner",
      menuItems: [],
      conditions: "Menu &amp; drinks\n\nOutdoor seating",
    });
  });
  it.each([
    [{ name: "Walk", description: "2 < 3 trees" }, "2 < 3 trees", ""],
    [
      {
        name: "Walk",
        description: "<p>2 &lt; 3 &amp; trees</p>",
        risks: "<p>Bring water</p>",
      },
      "2 < 3 & trees",
      "Bring water",
    ],
    [
      {
        name: "Walk",
        durationRhythm: null,
        description: "<p>Trees &amp; río</p>",
        risks: "<p>Wear shoes</p>",
      },
      "Trees & río",
      "Wear shoes",
    ],
  ])(
    "normalizes general activity HTML with and without current fields",
    (activity, description, recommendations) => {
      expect(
        create(
          "activity-voucher",
          {},
          { kind: "experience", activities: [activity] },
          0,
        ).data,
      ).toMatchObject({
        program: [{ id: "activity-0", title: "Walk", description }],
        recommendations,
      });
    },
  );
  it("preserves itinerary order, stable IDs and readable text without adding schedules", () => {
    const input: DocumentPrefillSource = {
      kind: "experience",
      itinerary: [
        null,
        { day: 9, title: "Later first", description: "  2 < 3 &amp;  " },
        { title: "Earlier last", description: "<p>Río<br>Sur</p>" },
      ],
    };
    const items = [
      {
        id: "itinerary-1",
        title: "Later first",
        description: "2 < 3 &",
      },
      { id: "itinerary-2", title: "Earlier last", description: "Río\nSur" },
    ];
    expect(create("experience-roadmap", {}, input).data).toMatchObject({
      activities: items,
    });
    expect(create("xsed-roadmap", {}, input).data).toMatchObject({
      stops: items.map(({ description, ...item }) => ({
        ...item,
        directions: description,
      })),
    });
  });
  it("normalizes edited legacy itinerary HTML despite a retained day property", () => {
    const itinerary = [
      { day: 1, title: "Arrival", description: "<p>Walk &amp; arrive</p>" },
    ];
    expect(
      create("experience-roadmap", {}, { kind: "experience", itinerary }).data,
    ).toMatchObject({
      activities: [
        { id: "itinerary-0", title: "Arrival", description: "Walk & arrive" },
      ],
    });
  });
  it.each(Object.entries(parsers))(
    "produces an independent valid %s draft from frozen inputs",
    (template, parser) => {
      const frozen = structuredClone(source);
      const freeze = (value: unknown): void => {
        if (value && typeof value === "object") {
          Object.values(value).forEach(freeze);
          Object.freeze(value);
        }
      };
      freeze(frozen);
      const result = create(
        template as keyof typeof parsers,
        Object.freeze({}),
        frozen,
        template === "activity-voucher" ? 1 : 0,
      );
      expect(parser(result, "draft")).toEqual({ ok: true, value: result });
      const saved = JSON.stringify(result);
      const another = create(template as keyof typeof parsers, {}, frozen, 0);
      for (const value of Object.values(another.data)) {
        if (Array.isArray(value)) value.push({ title: "Edit" });
        else if (value && typeof value === "object")
          Reflect.set(value, "name", "Edit");
      }
      expect(JSON.stringify(result)).toBe(saved);
      expect(result.data).not.toHaveProperty("paymentWording");
      expect(result.data).not.toHaveProperty("supplierConfirmation");
      expect(Reflect.get(result.data, "inclusions") ?? []).toEqual([]);
      expect(result.data).not.toHaveProperty("reservationReference");
      expect(frozen).toEqual(source);
    },
  );
  it.each([undefined, null, {}, Array(51).fill({ title: "Day" })])(
    "blanks unsupported or oversized itinerary arrays",
    (itinerary) => {
      expect(
        create("experience-roadmap", {}, { kind: "experience", itinerary })
          .data,
      ).toMatchObject({ activities: [] });
    },
  );
  it("preserves fifty items and blanks oversized text rather than truncating", () => {
    const itinerary = Array.from({ length: 50 }, (_, i) => ({
      day: i,
      title: "t".repeat(4000),
      description: "x".repeat(4001),
    }));
    const result = create(
      "experience-roadmap",
      {},
      { kind: "experience", itinerary },
    );
    if (result.template !== "experience-roadmap")
      throw new Error("Wrong template");
    expect(result.data.activities).toHaveLength(50);
    expect(result.data.activities[49]).toEqual({
      id: "itinerary-49",
      title: "t".repeat(4000),
      description: "",
    });
    expect(parseExperienceRoadmap(result, "draft").ok).toBe(true);
  });
  it("does not change previously created snapshots when source content changes", () => {
    const itinerary = [{ title: "Original", description: "<p>Original</p>" }];
    const first = create(
      "experience-roadmap",
      {},
      { kind: "experience", itinerary },
    );
    itinerary[0].description = "<p>Changed</p>";
    expect(first.data).toMatchObject({
      activities: [{ title: "Original", description: "Original" }],
    });
  });
  it("does not assign global inclusions, payment claims or booking schedules", () => {
    const input = {
      ...source,
      inclusions: ["Hotel and dinner"],
      paymentWording: "Paid",
      supplierConfirmation: "Confirmed",
    };
    for (const template of [
      "hotel-voucher",
      "activity-voucher",
      "dinner-voucher",
    ] as const) {
      const result = create(
        template,
        { startDate: new Date("2026-09-23") },
        input,
        template === "activity-voucher" ? 1 : 0,
      );
      expect(result.data).not.toHaveProperty("paymentWording");
      expect(result.data).not.toHaveProperty("supplierConfirmation");
      if (result.template === "hotel-voucher")
        expect(result.data.checkInDate).toBe("");
      else if (
        result.template === "activity-voucher" ||
        result.template === "dinner-voucher"
      )
        expect([result.data.date, result.data.time]).toEqual(["", ""]);
    }
  });
  it("blanks oversized joined narratives without losing the selected provider", () => {
    const input: DocumentPrefillSource = {
      kind: "xsed",
      activities: [{ name: "Dinner", description: "a".repeat(3000) }],
      sections: [null, { body: `<p>${"b".repeat(3000)}</p>` }],
    };
    expect(create("dinner-voucher", {}, input, 0).data).toMatchObject({
      service: "Dinner",
      conditions: "",
      menuItems: [],
    });
  });
});
