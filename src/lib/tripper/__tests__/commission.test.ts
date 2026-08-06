import { describe, expect, it } from "vitest";
import {
  DEFAULT_COMMISSION,
  commissionPercentToFraction,
  effectiveCommission,
  isValidCommissionPercent,
  toCommissionPercent,
} from "../commission";

describe("effectiveCommission", () => {
  it("defaults null to 15%", () => {
    expect(effectiveCommission(null)).toBe(0.15);
  });

  it("defaults undefined to 15%", () => {
    expect(effectiveCommission(undefined)).toBe(0.15);
  });

  it("keeps an explicit 0 as 0, not the default", () => {
    expect(effectiveCommission(0)).toBe(0);
  });

  it("keeps an explicit non-default fraction unchanged", () => {
    expect(effectiveCommission(0.2)).toBe(0.2);
  });
});

describe("toCommissionPercent", () => {
  it("converts a fraction to a whole percent", () => {
    expect(toCommissionPercent(0.2)).toBe(20);
  });

  it("applies the default before converting a null commission", () => {
    expect(toCommissionPercent(null)).toBe(15);
  });

  it("keeps an explicit 0 as 0%, not defaulted", () => {
    expect(toCommissionPercent(0)).toBe(0);
  });
});

describe("isValidCommissionPercent", () => {
  it("accepts the lower bound 0", () => {
    expect(isValidCommissionPercent(0)).toBe(true);
  });

  it("accepts the upper bound 100", () => {
    expect(isValidCommissionPercent(100)).toBe(true);
  });

  it("rejects a negative value", () => {
    expect(isValidCommissionPercent(-1)).toBe(false);
  });

  it("rejects a value above 100", () => {
    expect(isValidCommissionPercent(101)).toBe(false);
  });

  it("rejects a non-integer value", () => {
    expect(isValidCommissionPercent(12.5)).toBe(false);
  });

  it("rejects a string value", () => {
    expect(isValidCommissionPercent("15")).toBe(false);
  });

  it("rejects NaN", () => {
    expect(isValidCommissionPercent(NaN)).toBe(false);
  });
});

describe("commissionPercentToFraction", () => {
  it("converts 15 to 0.15", () => {
    expect(commissionPercentToFraction(15)).toBe(0.15);
  });

  it("converts 0 to 0", () => {
    expect(commissionPercentToFraction(0)).toBe(0);
  });
});

describe("DEFAULT_COMMISSION", () => {
  it("is 0.15", () => {
    expect(DEFAULT_COMMISSION).toBe(0.15);
  });
});
