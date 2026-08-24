import { describe, expect, it } from "vitest";
import {
  coverCropFromFocalPoint,
  normalizedCropToPixels,
  parseCropPayload,
} from "../crop";

const HERO_ASPECT = 16 / 9;

describe("coverCropFromFocalPoint", () => {
  it("crops full-height on a wide source (sourceAspect > aspect), fx drives horizontal offset", () => {
    const rect = coverCropFromFocalPoint(4000, 2000, HERO_ASPECT, 0, 50);
    expect(rect.x).toBeCloseTo(0, 5);
    expect(rect.y).toBeCloseTo(0, 5);
    expect(rect.width).toBeCloseTo(0.8888888888888888, 5);
    expect(rect.height).toBeCloseTo(1, 5);
  });

  it("crops full-width on a tall source (sourceAspect < aspect), fy drives vertical offset", () => {
    const rect = coverCropFromFocalPoint(1000, 2000, HERO_ASPECT, 50, 100);
    expect(rect.x).toBeCloseTo(0, 5);
    expect(rect.y).toBeCloseTo(0.71875, 5);
    expect(rect.width).toBeCloseTo(1, 5);
    expect(rect.height).toBeCloseTo(0.28125, 5);
  });

  it("returns the full frame for a square source at 1:1 aspect", () => {
    const rect = coverCropFromFocalPoint(1000, 1000, 1, 50, 50);
    expect(rect.x).toBeCloseTo(0, 5);
    expect(rect.y).toBeCloseTo(0, 5);
    expect(rect.width).toBeCloseTo(1, 5);
    expect(rect.height).toBeCloseTo(1, 5);
  });

  it("defaults null fx/fy to 50 (center)", () => {
    const withNulls = coverCropFromFocalPoint(1000, 2000, HERO_ASPECT, null, null);
    const withFifty = coverCropFromFocalPoint(1000, 2000, HERO_ASPECT, 50, 50);
    expect(withNulls).toEqual(withFifty);
  });
});

describe("parseCropPayload", () => {
  const valid = { x: 0.1, y: 0, width: 0.8, height: 0.45 };

  it("accepts a valid rect", () => {
    expect(parseCropPayload(valid)).toEqual(valid);
  });

  it("accepts a valid rect encoded as a JSON string", () => {
    expect(parseCropPayload(JSON.stringify(valid))).toEqual(valid);
  });

  it("rejects x < 0", () => {
    expect(parseCropPayload({ ...valid, x: -0.01 })).toBeNull();
  });

  it("rejects width > 1", () => {
    expect(parseCropPayload({ ...valid, width: 1.5 })).toBeNull();
  });

  it("rejects x + width > 1 + EPSILON", () => {
    expect(parseCropPayload({ x: 0.5, y: 0, width: 0.6, height: 0.5 })).toBeNull();
  });

  it("rejects NaN fields", () => {
    expect(parseCropPayload({ ...valid, x: NaN })).toBeNull();
  });

  it("rejects a plain (unparseable) string", () => {
    expect(parseCropPayload("not-json")).toBeNull();
  });

  it("rejects missing keys", () => {
    expect(parseCropPayload({ x: 0, y: 0, width: 0.5 })).toBeNull();
  });

  it("rejects null/undefined", () => {
    expect(parseCropPayload(null)).toBeNull();
    expect(parseCropPayload(undefined)).toBeNull();
  });
});

describe("normalizedCropToPixels", () => {
  it("converts a normalized rect to pixel extract args", () => {
    const px = normalizedCropToPixels(
      { x: 0.1, y: 0.2, width: 0.5, height: 0.5 },
      1000,
      1000,
    );
    expect(px).toEqual({ left: 100, top: 200, width: 500, height: 500 });
  });

  it("clamps out-of-range fractions to [0,1]", () => {
    const px = normalizedCropToPixels(
      { x: -0.5, y: 1.5, width: 2, height: -1 },
      1000,
      1000,
    );
    expect(px.left).toBeGreaterThanOrEqual(0);
    expect(px.top).toBeGreaterThanOrEqual(0);
    expect(px.left + px.width).toBeLessThanOrEqual(1000);
    expect(px.top + px.height).toBeLessThanOrEqual(1000);
  });

  it("never returns a width or height below 1px", () => {
    const px = normalizedCropToPixels(
      { x: 0.999, y: 0.999, width: 0.0001, height: 0.0001 },
      1000,
      1000,
    );
    expect(px.width).toBeGreaterThanOrEqual(1);
    expect(px.height).toBeGreaterThanOrEqual(1);
  });
});
