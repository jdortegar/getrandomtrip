import { describe, expect, it } from "vitest";
import {
  getWelcomeCountryName,
  resolveWelcomeCountry,
  shouldShowWelcome,
} from "../welcome";
import { getWelcomeFlagSvg } from "../welcome-flag.server";

describe("resolveWelcomeCountry", () => {
  it("uses the Netlify country header, normalized to uppercase", () => {
    expect(
      resolveWelcomeCountry({ allowOverride: false, headerCountry: " ar " }),
    ).toBe("AR");
  });

  it.each([undefined, null, "", "XX", "A1", "ARG", "zz"])(
    "returns null for a missing or unknown country (%s)",
    (headerCountry) => {
      expect(
        resolveWelcomeCountry({ allowOverride: false, headerCountry }),
      ).toBeNull();
    },
  );

  it("lets ?country override the header outside production", () => {
    expect(
      resolveWelcomeCountry({
        allowOverride: true,
        headerCountry: "AR",
        overrideCountry: "de",
      }),
    ).toBe("DE");
  });

  it("ignores ?country in production", () => {
    expect(
      resolveWelcomeCountry({
        allowOverride: false,
        headerCountry: "AR",
        overrideCountry: "DE",
      }),
    ).toBe("AR");
  });

  it("falls back to the header when the override is invalid", () => {
    expect(
      resolveWelcomeCountry({
        allowOverride: true,
        headerCountry: "AR",
        overrideCountry: "nope",
      }),
    ).toBe("AR");
  });
});

describe("getWelcomeCountryName", () => {
  it.each([
    ["DE", "es", "Alemania"],
    ["DE", "en", "Germany"],
    ["AR", "es", "Argentina"],
  ])("names %s in %s as %s", (code, locale, name) => {
    expect(getWelcomeCountryName(code, locale)).toBe(name);
  });
});

describe("getWelcomeFlagSvg", () => {
  it("returns the SVG markup for one country", () => {
    expect(getWelcomeFlagSvg("AR")).toMatch(/^<svg[\s\S]*<\/svg>$/);
  });
});

describe("shouldShowWelcome", () => {
  it("shows on the first visit", () => {
    expect(shouldShowWelcome("AR", null)).toBe(true);
  });

  it("stays quiet on later visits from the same country", () => {
    expect(shouldShowWelcome("AR", "AR")).toBe(false);
  });

  it("shows again when the country changes", () => {
    expect(shouldShowWelcome("CL", "AR")).toBe(true);
  });
});
