import { describe, expect, it } from "vitest";
import { MAX_REFINE_DETAILS } from "@/lib/constants/product-config";
import { getExcusesByTravelerType } from "@/lib/data/shared/excuses";
import { sanitizeExcuseSelection } from "@/lib/helpers/excuse-selection";

const base = { status: "SAVED", excuseKey: null, refineDetails: [] };

describe("sanitizeExcuseSelection", () => {
  it("accepts a valid excuse and keeps only its option keys, deduped", () => {
    const result = sanitizeExcuseSelection({
      ...base,
      type: "solo",
      level: "essenza",
      excuseKey: "solo-get-lost",
      refineDetails: [
        "sl-gl-naturaleza-silenciosa",
        "sl-gl-naturaleza-silenciosa",
        "not-an-option",
      ],
    });
    expect(result).toEqual({
      ok: true,
      excuseKey: "solo-get-lost",
      refineDetails: ["sl-gl-naturaleza-silenciosa"],
    });
  });

  it("rejects an excuse that belongs to another traveler type", () => {
    expect(
      sanitizeExcuseSelection({
        ...base,
        type: "couple",
        level: "bivouac",
        excuseKey: "solo-get-lost",
      }),
    ).toEqual({ ok: false, errorCode: "INVALID_EXCUSE" });
  });

  it("rejects an unknown excuse key", () => {
    expect(
      sanitizeExcuseSelection({
        ...base,
        type: "solo",
        level: "bivouac",
        excuseKey: "nope",
      }),
    ).toEqual({ ok: false, errorCode: "INVALID_EXCUSE" });
  });

  it("requires an excuse when the step applies and status is not DRAFT", () => {
    expect(
      sanitizeExcuseSelection({ ...base, type: "solo", level: "essenza" }),
    ).toEqual({ ok: false, errorCode: "EXCUSE_REQUIRED" });
  });

  it("lets a DRAFT omit the excuse", () => {
    expect(
      sanitizeExcuseSelection({
        ...base,
        status: "DRAFT",
        type: "solo",
        level: "essenza",
      }),
    ).toEqual({ ok: true, excuseKey: null, refineDetails: [] });
  });

  it("drops the selection silently when the step does not apply", () => {
    expect(
      sanitizeExcuseSelection({
        ...base,
        type: "honeymoon",
        level: "bivouac",
        excuseKey: "honeymoon-luxury",
        refineDetails: ["x"],
      }),
    ).toEqual({ ok: true, excuseKey: null, refineDetails: [] });
    expect(
      sanitizeExcuseSelection({
        ...base,
        type: "couple",
        level: "atelier-getaway",
        excuseKey: "couple-anything",
      }),
    ).toEqual({ ok: true, excuseKey: null, refineDetails: [] });
  });

  it("uses the stored level as traveler type for xsed trips", () => {
    const solo = sanitizeExcuseSelection({
      ...base,
      type: "xsed",
      level: "solo",
      excuseKey: "solo-get-lost",
    });
    expect(solo).toMatchObject({ ok: true, excuseKey: "solo-get-lost" });
    expect(
      sanitizeExcuseSelection({ ...base, type: "xsed", level: "solo" }),
    ).toEqual({ ok: false, errorCode: "EXCUSE_REQUIRED" });
  });

  it("does not require an excuse for xsed honeymoon", () => {
    expect(
      sanitizeExcuseSelection({ ...base, type: "xsed", level: "honeymoon" }),
    ).toEqual({ ok: true, excuseKey: null, refineDetails: [] });
  });

  it("keeps at most MAX_REFINE_DETAILS refine keys, first ones win", () => {
    const options = getExcusesByTravelerType("solo")
      .find((e) => e.key === "solo-get-lost")!
      .details.options.map((o) => o.key);
    expect(options.length).toBeGreaterThan(MAX_REFINE_DETAILS);
    const result = sanitizeExcuseSelection({
      ...base,
      type: "solo",
      level: "essenza",
      excuseKey: "solo-get-lost",
      refineDetails: ["not-an-option", ...options],
    });
    expect(result).toEqual({
      ok: true,
      excuseKey: "solo-get-lost",
      refineDetails: options.slice(0, MAX_REFINE_DETAILS),
    });
  });
});
