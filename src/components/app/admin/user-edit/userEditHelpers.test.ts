import { describe, expect, it } from "vitest";
import {
  gridStateFromOverrides,
  isGridStateDirty,
  overridesPayloadFromGridState,
} from "./userEditHelpers";

describe("gridStateFromOverrides", () => {
  it("returns an empty grid for null overrides", () => {
    expect(gridStateFromOverrides(null)).toEqual({});
  });

  it("converts stored numeric overrides into display strings", () => {
    const result = gridStateFromOverrides({ couple: { essenza: 220 } });
    expect(result).toEqual({ couple: { essenza: "220" } });
  });

  it("keeps an explicit 0 override as the string \"0\", not empty", () => {
    const result = gridStateFromOverrides({ couple: { explora: 0 } });
    expect(result).toEqual({ couple: { explora: "0" } });
  });
});

describe("overridesPayloadFromGridState (grid -> payload round-trip)", () => {
  it("round-trips a filled cell back to the original override shape", () => {
    const overrides = { couple: { essenza: 220, explora: 0 } };
    const grid = gridStateFromOverrides(overrides);
    expect(overridesPayloadFromGridState(grid)).toEqual(overrides);
  });

  it("omits empty-string cells (inherit) from the payload", () => {
    const grid = { couple: { essenza: "220", explora: "" } };
    expect(overridesPayloadFromGridState(grid)).toEqual({
      couple: { essenza: 220 },
    });
  });

  it("omits a type entirely once all of its cells are empty", () => {
    const grid = { couple: { essenza: "" } };
    expect(overridesPayloadFromGridState(grid)).toEqual({});
  });

  it("ignores a non-numeric cell value (invalid input, not yet saveable)", () => {
    const grid = { couple: { essenza: "abc" } };
    expect(overridesPayloadFromGridState(grid)).toEqual({});
  });

  it("trims whitespace before parsing", () => {
    const grid = { couple: { essenza: " 220 " } };
    expect(overridesPayloadFromGridState(grid)).toEqual({
      couple: { essenza: 220 },
    });
  });
});

describe("isGridStateDirty", () => {
  it("is false for two grids with identical filled cells", () => {
    const a = { couple: { essenza: "220" } };
    const b = { couple: { essenza: "220" } };
    expect(isGridStateDirty(a, b)).toBe(false);
  });

  it("is false when both sides only differ by an empty cell key", () => {
    const a = { couple: { essenza: "220" } };
    const b = { couple: { essenza: "220", explora: "" } };
    expect(isGridStateDirty(a, b)).toBe(false);
  });

  it("is true when a cell value changed", () => {
    const a = { couple: { essenza: "220" } };
    const b = { couple: { essenza: "250" } };
    expect(isGridStateDirty(a, b)).toBe(true);
  });

  it("is true when a cell was cleared", () => {
    const a = { couple: { essenza: "220" } };
    const b = { couple: { essenza: "" } };
    expect(isGridStateDirty(a, b)).toBe(true);
  });

  it("is true when a new cell was filled in", () => {
    const a = {};
    const b = { couple: { essenza: "220" } };
    expect(isGridStateDirty(a, b)).toBe(true);
  });

  it("is true for an interim invalid value (not yet a valid number)", () => {
    const a = { couple: { essenza: "220" } };
    const b = { couple: { essenza: "abc" } };
    expect(isGridStateDirty(a, b)).toBe(true);
  });
});
