import { describe, expect, it } from "vitest";
import {
  isModalDirty,
  shouldIncludeCommission,
} from "../userRoleModalHelpers";

describe("shouldIncludeCommission", () => {
  it("is false when the user is a tripper but the field was never touched", () => {
    // This is the leak case: a null-commission tripper's displayed default
    // (e.g. 15) must NOT be sent just because Tripper is checked.
    expect(shouldIncludeCommission(true, false)).toBe(false);
  });

  it("is true only when the field was actually edited", () => {
    expect(shouldIncludeCommission(true, true)).toBe(true);
  });

  it("is false when not a tripper, regardless of touched state", () => {
    expect(shouldIncludeCommission(false, true)).toBe(false);
  });

  it("is false when neither a tripper nor touched", () => {
    expect(shouldIncludeCommission(false, false)).toBe(false);
  });
});

describe("isModalDirty", () => {
  it("is true on a roles-only change with commission untouched", () => {
    expect(isModalDirty(true, false, false, true)).toBe(true);
  });

  it("is false when nothing changed", () => {
    expect(isModalDirty(false, false, false, true)).toBe(false);
  });

  it("is true when only commission was touched and is valid", () => {
    expect(isModalDirty(false, true, true, true)).toBe(true);
  });

  it("is false when commission was touched but is invalid", () => {
    expect(isModalDirty(false, true, true, false)).toBe(false);
  });

  it("is false when roles changed but the touched-invalid commission blocks save", () => {
    expect(isModalDirty(true, true, true, false)).toBe(false);
  });
});
