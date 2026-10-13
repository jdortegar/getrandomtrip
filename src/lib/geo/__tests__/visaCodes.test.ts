import { describe, expect, it } from "vitest";
import {
  resolveNationalityCode,
  resolveVisaCode,
  toVisaCodes,
} from "../visaCodes";

describe("resolveVisaCode", () => {
  it.each([
    ["US", "US"],
    ["de", "DE"],
    ["United States", "US"],
    ["Reino Unido", "GB"],
    ["Vietnam", "VN"],
  ])("resolves the country value %j to %j", (value, code) => {
    expect(resolveVisaCode(value)).toBe(code);
  });

  it.each(["Schengena", "Schengen", "SCHENGEN", "Schengen Area", "Espacio Schengen", "  zona   SCHENGEN ", "Schengén"])(
    "resolves the Schengen spelling %j to SCHENGEN",
    (value) => {
      expect(resolveVisaCode(value)).toBe("SCHENGEN");
    },
  );

  it.each(["Atlantis", "", "   ", "XX"])("returns null for the unknown value %j", (value) => {
    expect(resolveVisaCode(value)).toBeNull();
  });
});

describe("toVisaCodes", () => {
  it("converts legacy names to deduped visa codes in input order", () => {
    expect(toVisaCodes(["Japan", "Schengena", "JP", "United States"])).toEqual({
      codes: ["JP", "SCHENGEN", "US"],
      unresolved: [],
    });
  });

  it("drops unresolved names from the codes and reports them trimmed", () => {
    expect(toVisaCodes([" Atlantis ", "Canada"])).toEqual({
      codes: ["CA"],
      unresolved: ["Atlantis"],
    });
  });

  it("ignores blank values", () => {
    expect(toVisaCodes(["", "  "])).toEqual({ codes: [], unresolved: [] });
  });
});

describe("resolveNationalityCode", () => {
  it.each([
    ["AR", "AR"],
    ["ar", "AR"],
    ["Argentina", "AR"],
    ["España", "ES"],
  ])("resolves %j to %j", (value, code) => {
    expect(resolveNationalityCode(value)).toBe(code);
  });

  it.each([null, undefined, "", "Schengen", "SCHENGEN", "Atlantis"])(
    "returns null for %j (visa zones are never nationalities)",
    (value) => {
      expect(resolveNationalityCode(value)).toBeNull();
    },
  );
});
