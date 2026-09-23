import { describe, expect, it } from "vitest";
import { createTripDocumentSnapshot as create } from "../snapshots";
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

const source = {
  user: { name: "Ana Pérez", locale: "en" },
  originCity: "Buenos Aires",
  startDate: new Date("2026-09-23T00:00:00.000Z"),
  endDate: new Date("2026-09-25T00:00:00.000Z"),
  pax: 3,
  travelers: [{ fullName: "Luis" }, { fullName: null }],
  experience: {
    title: "Escapada",
    destinationCity: "Tandil",
    destinationCountry: "AR",
  },
};

describe("createTripDocumentSnapshot", () => {
  it.each([NaN, "+010000-01-01", "-000001-01-01"])(
    "keeps malformed dates (%s) or oversized facts out of drafts",
    (invalidDate) => {
      const oversized = "x".repeat(4001);
      const input = {
        ...source,
        originCity: oversized,
        startDate: new Date(invalidDate),
        endDate: new Date(invalidDate),
        user: { name: oversized },
        travelers: [{ fullName: oversized }],
        experience: {
          title: oversized,
          destinationCity: oversized,
          destinationCountry: "XX",
        },
      };
      for (const [template, parser] of Object.entries(parsers)) {
        const snapshot = create(template as keyof typeof parsers, input);
        expect(parser(snapshot, "draft")).toEqual({
          ok: true,
          value: snapshot,
        });
        expect(snapshot.country).toBe("");
      }
      expect(create("experience-roadmap", input).data).toMatchObject({
        origin: "",
        destination: "",
        heading: "",
        startDate: "",
        endDate: "",
      });
    },
  );
  it("bounds the combined roster and retains inclusive text/date facts", () => {
    const input = {
      ...source,
      user: { name: "á".repeat(4000) },
      originCity: "x".repeat(4000),
    };
    expect(create("hotel-voucher", input).data).toMatchObject({
      holder: "á".repeat(4000),
      guests: "",
    });
    expect(create("xsed-roadmap", input).data).toMatchObject({
      origin: "x".repeat(4000),
      departureDate: "2026-09-23",
    });
  });
  it.each(Object.entries(parsers))(
    "creates independent valid %s drafts",
    (template, parser) => {
      for (const input of [{}, source]) {
        const snapshot = create(template as keyof typeof parsers, input);
        expect(snapshot.template).toBe(template);
        expect(parser(snapshot, "draft")).toEqual({
          ok: true,
          value: snapshot,
        });
        const saved = JSON.stringify(snapshot);
        const another = create(template as keyof typeof parsers, input);
        for (const [key, value] of Object.entries(another.data)) {
          if (Array.isArray(value)) value.push("edited");
          else if (value && typeof value === "object")
            Reflect.set(value, "name", "edited");
          else Reflect.set(another.data, key, "edited");
        }
        expect(JSON.stringify(snapshot)).toBe(saved);
      }
    },
  );
  it("prefills travel facts without treating them as supplier bookings", () => {
    const paid = {
      ...source,
      payment: { status: "APPROVED" },
      actualDestination: "Azul",
    };
    const cases = {
      "experience-roadmap": {
        origin: "Buenos Aires",
        destination: "Azul",
        startDate: "2026-09-23",
        endDate: "2026-09-25",
        duration: "",
        heading: "Escapada",
        activities: [],
      },
      "hotel-voucher": {
        holder: "Ana Pérez",
        guests: "3 travelers\nAna Pérez\nLuis",
        checkInDate: "",
        checkOutDate: "",
        property: { name: "", address: "" },
        inclusions: [],
      },
      "activity-voucher": {
        holder: "Ana Pérez",
        participants: "3 travelers\nAna Pérez\nLuis",
        date: "",
        time: "",
        provider: { name: "", address: "" },
        program: [],
      },
      "dinner-voucher": {
        holder: "Ana Pérez",
        guests: "3 travelers\nAna Pérez\nLuis",
        date: "",
        time: "",
        restaurant: { name: "", address: "" },
        service: "",
        menuItems: [],
      },
    };
    for (const [template, data] of Object.entries(cases))
      expect(create(template as keyof typeof parsers, paid)).toEqual({
        template,
        templateVersion: 1,
        label: "",
        country: "AR",
        locale: "en",
        data,
      });
  });
  it.each(["en", "es", "fr", "EN", "", null, undefined])(
    "defaults locale from buyer %s",
    (locale) => {
      const snapshot = create("dinner-voucher", {
        user: { locale },
        pax: 1,
      });
      expect(snapshot.locale).toBe(locale === "en" ? "en" : "es");
      expect(snapshot.data).toMatchObject({
        guests: locale === "en" ? "1 traveler" : "1 viajero",
      });
    },
  );
  it("uses Spanish count copy and preserves known companion order", () => {
    const snapshot = create("hotel-voucher", {
      ...source,
      user: { name: "Ana", locale: "es" },
      travelers: [{ fullName: "Zoe" }, { fullName: "Luis" }],
    });
    expect(snapshot.data).toMatchObject({
      guests: "3 viajeros\nAna\nZoe\nLuis",
    });
  });
  it.each([0, -1, 1.5, NaN, Infinity, null, undefined])(
    "does not invent missing headcount for %s",
    (pax) => {
      const snapshot = create("activity-voucher", {
        ...source,
        pax,
      });
      expect(snapshot.data).toMatchObject({ participants: "Ana Pérez\nLuis" });
    },
  );
  it("leaves absent facts blank without retaining mutable sources", () => {
    const input = structuredClone(source);
    const snapshot = create("experience-roadmap", input);
    input.startDate.setUTCDate(1);
    input.experience.title = "Changed";
    input.originCity = "Changed";
    expect(snapshot.data).toMatchObject({
      startDate: "2026-09-23",
      heading: "Escapada",
      origin: "Buenos Aires",
    });
    expect(create("hotel-voucher", {}).data).toEqual({
      holder: "",
      guests: "",
      checkInDate: "",
      checkOutDate: "",
      property: { name: "", address: "" },
      inclusions: [],
    });
  });
  it("copies trip dates and origin into an editable roadmap", () => {
    expect(create("xsed-roadmap", source)).toEqual({
      template: "xsed-roadmap",
      templateVersion: 1,
      label: "",
      locale: "en",
      country: "AR",
      data: {
        origin: "Buenos Aires",
        destination: "Tandil",
        departureDate: "2026-09-23",
        departureTime: "",
        drivingDuration: "",
        stops: [],
      },
    });
  });
});
