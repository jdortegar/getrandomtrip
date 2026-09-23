import { describe, expect, it } from "vitest";
import { parseExperienceRoadmap } from "../experienceRoadmap";

const activity = {
  id: "a1",
  title: "Café",
  description: "  Explore the town.  ",
};
const data = {
  startDate: "2026-09-23",
  endDate: "2026-09-25",
  origin: "Buenos Aires",
  destination: "Tandil",
  duration: "3 days",
  heading: "A quiet weekend",
  activities: [activity],
};
const document = {
  template: "experience-roadmap",
  templateVersion: 1,
  label: " Guide ",
  country: "TT",
  locale: "es",
  data,
};
const parse = (patch: object, mode: "draft" | "generation" = "generation") =>
  parseExperienceRoadmap({ ...document, data: { ...data, ...patch } }, mode);
const success = (patch: object) => ({
  ok: true,
  value: { ...document, label: "Guide", data: { ...data, ...patch } },
});
function error(result: unknown, path: string, code: string) {
  expect(result).toEqual({
    ok: false,
    errors: expect.arrayContaining([{ path, code }]),
  });
}

describe("parseExperienceRoadmap", () => {
  it("rejects invalid calendar dates, reversed ranges and unsafe links", () => {
    error(parse({ startDate: "2025-02-29" }), "data.startDate", "invalid_date");
    error(parse({ endDate: "2026-09-22" }), "data.endDate", "invalid_range");
    error(parse({ endDate: "2026-13-01" }), "data.endDate", "invalid_date");
    error(
      parse({ mapUrl: "http://example.com" }),
      "data.mapUrl",
      "invalid_url",
    );
    const patch = { endDate: "2026-09-22", mapUrl: "https:" };
    expect(parse(patch, "draft")).toEqual(success(patch));
  });
  it("validates optional activity timing and preserves order at inclusive bounds", () => {
    const invalid = [{ ...activity, date: "2025-02-29", time: "24:00" }];
    error(
      parse({ activities: invalid }),
      "data.activities.0.date",
      "invalid_date",
    );
    error(
      parse({ activities: invalid }),
      "data.activities.0.time",
      "invalid_time",
    );
    const activities = Array.from({ length: 50 }, (_, i) => ({
      ...activity,
      id: `${50 - i}`,
      date: "2026-09-23",
      time: "09:00",
    }));
    const patch = {
      activities,
      endDate: data.startDate,
      heading: "á".repeat(4000),
      mapUrl: "https://example.com",
    };
    expect(parse(patch)).toEqual(success(patch));
  });
  it("preserves complete custom content and normalizes only metadata", () => {
    expect(parse({})).toEqual(success({}));
  });
  it.each(Object.keys(data).filter((key) => key !== "activities"))(
    "requires %s only for generation",
    (field) => {
      expect(parse({ [field]: "" }, "draft")).toEqual(success({ [field]: "" }));
      error(parse({ [field]: "" }), `data.${field}`, "required");
    },
  );
  for (const mode of ["draft", "generation"] as const) {
    it.each([
      ["$", null],
      ["$", []],
      ["$", { ...document, privateKey: "secret" }],
      [
        "$",
        Object.defineProperty({ ...document }, "data", { enumerable: false }),
      ],
      ["data", { ...document, data: { ...data, extra: true } }],
      [
        "data.activities.0",
        { ...document, data: { ...data, activities: [null] } },
      ],
    ])(`rejects malformed %s in ${mode}`, (path, input) =>
      error(parseExperienceRoadmap(input, mode), String(path), "invalid_shape"),
    );
    it.each(["template", "templateVersion", "locale", "country"])(
      `validates %s in ${mode}`,
      (field) => {
        const codes = {
          template: "invalid_value",
          templateVersion: "invalid_value",
          locale: "invalid_locale",
          country: "invalid_country",
        };
        error(
          parseExperienceRoadmap({ ...document, [field]: "bad" }, mode),
          field,
          codes[field as keyof typeof codes],
        );
      },
    );
    it.each([
      ...Object.keys(data).filter((key) => key !== "activities"),
      "mapUrl",
    ])(`bounds %s in ${mode}`, (field) => {
      error(parse({ [field]: null }, mode), `data.${field}`, "invalid_type");
      error(
        parse({ [field]: "x".repeat(4001) }, mode),
        `data.${field}`,
        "too_long",
      );
    });
    it(`bounds activities and requires unique IDs in ${mode}`, () => {
      error(
        parse({ activities: Array(51).fill(activity) }, mode),
        "data.activities",
        "invalid_array",
      );
      error(
        parse({ activities: [activity, activity] }, mode),
        "data.activities.1.id",
        "duplicate_id",
      );
      error(
        parse({ activities: [{ ...activity, id: "" }] }, mode),
        "data.activities.0.id",
        "required",
      );
      error(
        parse(
          { activities: [{ ...activity, description: "x".repeat(4001) }] },
          mode,
        ),
        "data.activities.0.description",
        "too_long",
      );
    });
  }
  it("saves empty activities in drafts but requires complete activities for generation", () => {
    expect(parse({ activities: [] }, "draft")).toEqual(
      success({ activities: [] }),
    );
    error(parse({ activities: [] }), "data.activities", "required");
    error(
      parse({ activities: [{ ...activity, title: "", description: "" }] }),
      "data.activities.0.title",
      "required",
    );
  });
});
