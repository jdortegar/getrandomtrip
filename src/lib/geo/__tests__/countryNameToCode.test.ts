import { describe, expect, it } from "vitest";
import { resolveCountryCode } from "../countryNameToCode";

describe("resolveCountryCode", () => {
  it.each([
    ["Argentina", "AR"],
    ["argentina", "AR"],
    ["  Argentina ", "AR"],
    ["Brasil", "BR"],
    ["Brazil", "BR"],
    ["México", "MX"],
    ["Mexico", "MX"],
    ["Perú", "PE"],
    ["Peru", "PE"],
    ["Estados Unidos", "US"],
    ["United States", "US"],
    ["España", "ES"],
    ["Spain", "ES"],
    ["Alemania", "DE"],
    ["Germany", "DE"],
    ["Reino Unido", "GB"],
    ["United Kingdom", "GB"],
    ["Uruguay", "UY"],
    ["República Dominicana", "DO"],
    ["Dominican Republic", "DO"],
    ["ar", "AR"],
  ])("maps %s to %s", (name, code) => {
    expect(resolveCountryCode(name)).toBe(code);
  });

  it.each(["", "   ", "Atlantis", "Argentin", null, undefined])(
    "returns null for unknown input %s",
    (input) => {
      expect(resolveCountryCode(input)).toBeNull();
    },
  );
});
