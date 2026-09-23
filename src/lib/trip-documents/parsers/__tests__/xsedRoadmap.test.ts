import { describe, expect, it } from "vitest";
import { parseXsedRoadmap } from "../xsedRoadmap";

const stop = {
  id: "stop-1",
  title: "Chascomús",
  directions: "  Follow route 2.  ",
};
const data = {
  origin: "Buenos Aires",
  destination: "Tandil",
  departureDate: "2026-09-23",
  departureTime: "09:30",
  drivingDuration: "4 hours",
  stops: [stop],
};
const document = {
  template: "xsed-roadmap",
  templateVersion: 1,
  label: " Roadmap ",
  country: "AR",
  locale: "en",
  data,
};
const parseData = (
  patch: object,
  mode: "draft" | "generation" = "generation",
) => parseXsedRoadmap({ ...document, data: { ...data, ...patch } }, mode);
function expectError(result: unknown, path: string, code: string) {
  expect(result).toEqual({
    ok: false,
    errors: expect.arrayContaining([{ path, code }]),
  });
}
const success = (patch: object) => ({
  ok: true,
  value: { ...document, label: "Roadmap", data: { ...data, ...patch } },
});

describe("parseXsedRoadmap", () => {
  it.each(["template", "templateVersion", "data"])(
    "rejects hidden %s",
    (field) => {
      const input = Object.defineProperty({ ...document }, field, {
        enumerable: false,
      });
      expectError(parseXsedRoadmap(input, "generation"), "$", "invalid_shape");
    },
  );
  it("parses a complete roadmap while preserving authored text", () => {
    expect(parseXsedRoadmap(document, "generation")).toEqual(success({}));
  });

  it("saves incomplete drafts but rejects generation until completed", () => {
    const blank = {
      origin: "",
      destination: "",
      departureDate: "2026-",
      departureTime: "9:",
      drivingDuration: "",
      stops: [],
      mapUrl: "https:",
    };
    expect(parseData(blank, "draft")).toEqual(success(blank));
    expectError(parseData(blank), "data.origin", "required");
    expectError(parseData(blank), "data.stops", "required");
  });

  it.each([
    "origin",
    "destination",
    "departureDate",
    "departureTime",
    "drivingDuration",
  ])("requires %s for generation", (field) => {
    expectError(parseData({ [field]: " \n" }), `data.${field}`, "required");
  });

  it.each(["title", "directions"])(
    "requires stop %s for generation only",
    (field) => {
      const stops = [{ ...stop, [field]: "" }];
      expectError(parseData({ stops }), `data.stops.0.${field}`, "required");
      expect(parseData({ stops }, "draft")).toEqual(success({ stops }));
    },
  );

  for (const mode of ["draft", "generation"] as const) {
    it.each([
      ["$", null],
      ["$", []],
      ["$", Object.create(document)],
      ["$", { ...document, storageKey: "private" }],
      ["data", { ...document, data: null }],
      [
        "data",
        {
          ...document,
          data: Object.defineProperty({ ...data }, "origin", {
            enumerable: false,
          }),
        },
      ],
      ["data", { ...document, data: { ...data, extra: true } }],
      ["data.stops.0", { ...document, data: { ...data, stops: [null] } }],
      [
        "data.stops.0",
        { ...document, data: { ...data, stops: [{ ...stop, extra: true }] } },
      ],
    ])(`rejects malformed shape at %s in ${mode}`, (path, input) => {
      expectError(parseXsedRoadmap(input, mode), String(path), "invalid_shape");
    });
    it.each(["template", "templateVersion", "locale", "country"])(
      `validates %s in ${mode}`,
      (field) => {
        const codes = {
          template: "invalid_value",
          templateVersion: "invalid_value",
          locale: "invalid_locale",
          country: "invalid_country",
        };
        expectError(
          parseXsedRoadmap({ ...document, [field]: "bad" }, mode),
          field,
          codes[field as keyof typeof codes],
        );
      },
    );
    it.each([...Object.keys(data).filter((key) => key !== "stops"), "mapUrl"])(
      `bounds %s in ${mode}`,
      (field) => {
        expectError(
          parseData({ [field]: 12 }, mode),
          `data.${field}`,
          "invalid_type",
        );
        expectError(
          parseData({ [field]: "x".repeat(4001) }, mode),
          `data.${field}`,
          "too_long",
        );
      },
    );
    it.each([null, {}, "stop", Array(51).fill(stop)])(
      `bounds stops in ${mode}`,
      (stops) => {
        expectError(parseData({ stops }, mode), "data.stops", "invalid_array");
      },
    );
    it.each(["id", "title", "directions", "date", "time"])(
      `bounds stop %s in ${mode}`,
      (field) => {
        for (const [value, code] of [
          [null, "invalid_type"],
          ["x".repeat(4001), "too_long"],
        ] as const) {
          const result = parseData(
            { stops: [{ ...stop, [field]: value }] },
            mode,
          );
          expectError(result, `data.stops.0.${field}`, code);
        }
      },
    );
    it(`requires unique stop IDs in ${mode}`, () => {
      const blank = parseData({ stops: [{ ...stop, id: "" }] }, mode);
      expectError(blank, "data.stops.0.id", "required");
      expectError(
        parseData({ stops: [stop, stop] }, mode),
        "data.stops.1.id",
        "duplicate_id",
      );
    });
  }
  it.each([
    ["departureDate", "2025-02-29", "invalid_date"],
    ["departureTime", "24:00", "invalid_time"],
    ["mapUrl", "https://user:pass@example.com", "invalid_url"],
    ["mapUrl", " ", "invalid_url"],
  ])("validates %s only when generating", (field, value, code) => {
    expectError(parseData({ [field]: value }), `data.${field}`, code);
    expect(parseData({ [field]: value }, "draft")).toEqual(
      success({ [field]: value }),
    );
  });
  it("validates optional stop dates/times and preserves authored order", () => {
    const invalid = { ...stop, date: "2025-02-29", time: "24:00" };
    expectError(
      parseData({ stops: [invalid] }),
      "data.stops.0.date",
      "invalid_date",
    );
    expectError(
      parseData({ stops: [invalid] }),
      "data.stops.0.time",
      "invalid_time",
    );
    const stops = Array.from({ length: 50 }, (_, i) => ({
      ...stop,
      id: `${50 - i}`,
      date: "2024-02-29",
      time: "23:59",
    }));
    const patch = {
      stops,
      origin: "á".repeat(4000),
      mapUrl: "https://example.com/map",
    };
    expect(parseData(patch)).toEqual(success(patch));
  });
});
