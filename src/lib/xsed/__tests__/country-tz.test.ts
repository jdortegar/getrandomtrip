import { describe, expect, it } from "vitest";
import {
  COUNTRY_TZ,
  countryToTimezone,
  timezoneToCountry,
} from "../country-tz";
import { SUPPORTED_TIMEZONES } from "../window";

describe("XSED counter countries", () => {
  it.each(SUPPORTED_TIMEZONES)(
    "maps supported zone %s to a supported country",
    (tz) => {
      const country = timezoneToCountry(tz);
      expect(country).toMatch(/^[A-Z]{2}$/);
      expect(Object.hasOwn(COUNTRY_TZ, country!)).toBe(true);
    },
  );

  it("shares Mexico across its timezones without sharing Argentina", () => {
    expect(timezoneToCountry("America/Tijuana")).toBe("MX");
    expect(timezoneToCountry("America/Mexico_City")).toBe("MX");
    expect(timezoneToCountry("America/Argentina/Cordoba")).toBe("AR");
  });

  it.each([null, "", "America/Toronto", "UTC", "constructor", "__proto__"])(
    "does not infer inventory for unknown zone %s",
    (tz) => {
      expect(timezoneToCountry(tz)).toBeNull();
    },
  );

  it.each(["", "ZZ", "US", "constructor", "__proto__"])(
    "rejects unsupported country %s",
    (country) => {
      expect(countryToTimezone(country)).toBeNull();
    },
  );
});
