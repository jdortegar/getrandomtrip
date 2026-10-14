import { describe, expect, it } from "vitest";
import {
  ISO_COUNTRY_CODES,
  countryLabel,
  countryOptions,
  VISA_ZONE_CODES,
  isIsoCountryCode,
  isVisaCode,
  normalizeCountryCodes,
  normalizeVisaCodes,
} from "../countryOptions";

describe("ISO_COUNTRY_CODES", () => {
  it("lists the 249 ISO 3166-1 alpha-2 codes, uppercase and unique", () => {
    expect(ISO_COUNTRY_CODES).toHaveLength(249);
    expect(new Set(ISO_COUNTRY_CODES).size).toBe(249);
    expect(ISO_COUNTRY_CODES.every((code) => /^[A-Z]{2}$/.test(code))).toBe(true);
  });
});

describe("isIsoCountryCode", () => {
  it.each(["AR", "DE", "US", "HK", "PS"])("accepts %s", (code) => {
    expect(isIsoCountryCode(code)).toBe(true);
  });

  it.each(["ar", "Germany", "XX", "DD", "EU", "", " AR", "ARG", "SCHENGEN"])(
    "rejects %j",
    (value) => {
      expect(isIsoCountryCode(value)).toBe(false);
    },
  );

  it("rejects non-string values", () => {
    expect(isIsoCountryCode(null)).toBe(false);
    expect(isIsoCountryCode(42)).toBe(false);
  });
});

describe("countryLabel", () => {
  it.each([
    ["DE", "es", "Alemania"],
    ["DE", "en", "Germany"],
    ["AR", "es", "Argentina"],
    ["US", "en", "United States"],
    ["ES", "es", "España"],
  ])("labels %s in %s as %s", (code, locale, label) => {
    expect(countryLabel(code, locale)).toBe(label);
  });

  it("returns the code itself for an unknown value", () => {
    expect(countryLabel("??", "es")).toBe("??");
  });
});

describe("countryOptions", () => {
  it("returns one option per ISO code with localized labels", () => {
    const options = countryOptions("es");
    expect(options).toHaveLength(ISO_COUNTRY_CODES.length);
    expect(options.find((o) => o.value === "DE")?.label).toBe("Alemania");
  });

  it("sorts options by localized label with a locale-aware compare", () => {
    for (const locale of ["es", "en"]) {
      const labels = countryOptions(locale).map((o) => o.label);
      const sorted = [...labels].sort((a, b) => a.localeCompare(b, locale));
      expect(labels).toEqual(sorted);
    }
  });

  it("orders accented labels next to their base letter, not after Z", () => {
    const labels = countryOptions("en").map((o) => o.label);
    expect(labels.indexOf("Åland Islands")).toBeGreaterThan(-1);
    expect(labels.indexOf("Åland Islands")).toBeLessThan(labels.indexOf("Belgium"));
  });

  it("differs between locales", () => {
    const es = countryOptions("es").find((o) => o.value === "DE")?.label;
    const en = countryOptions("en").find((o) => o.value === "DE")?.label;
    expect([es, en]).toEqual(["Alemania", "Germany"]);
  });
});

describe("normalizeCountryCodes", () => {
  it("uppercases, trims, dedupes (first occurrence wins) and drops invalid values", () => {
    expect(
      normalizeCountryCodes(["ar", " DE ", "AR", "Germany", "", "xx", "de", "US"]),
    ).toEqual(["AR", "DE", "US"]);
  });

  it("returns an empty list for empty input", () => {
    expect(normalizeCountryCodes([])).toEqual([]);
  });

  it("drops the SCHENGEN visa zone (not a nationality)", () => {
    expect(normalizeCountryCodes(["AR", "SCHENGEN", "schengen"])).toEqual(["AR"]);
  });
});

describe("VISA_ZONE_CODES", () => {
  it("lists SCHENGEN as the only visa zone", () => {
    expect(VISA_ZONE_CODES).toEqual(["SCHENGEN"]);
  });
});

describe("isVisaCode", () => {
  it.each(["AR", "US", "SCHENGEN"])("accepts %s", (code) => {
    expect(isVisaCode(code)).toBe(true);
  });

  it.each(["schengen", "Schengen", "EU", "XX", "", " US", null, 42])(
    "rejects %j",
    (value) => {
      expect(isVisaCode(value)).toBe(false);
    },
  );
});

describe("normalizeVisaCodes", () => {
  it("uppercases, trims, dedupes and keeps SCHENGEN", () => {
    expect(
      normalizeVisaCodes(["us", " schengen ", "SCHENGEN", "Germany", "xx", "US", "CA"]),
    ).toEqual(["US", "SCHENGEN", "CA"]);
  });

  it("returns an empty list for empty input", () => {
    expect(normalizeVisaCodes([])).toEqual([]);
  });
});
