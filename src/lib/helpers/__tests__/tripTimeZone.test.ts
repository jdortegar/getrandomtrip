import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_DEPARTURE_TIME_ZONE,
  getBookingTimeZoneInputs,
  isValidTimeZone,
  localTimeToUtc,
  resolveDepartureTimeZone,
} from "../tripTimeZone";

describe("isValidTimeZone", () => {
  it("accepts IANA zones and rejects junk", () => {
    expect(isValidTimeZone("America/Argentina/Buenos_Aires")).toBe(true);
    expect(isValidTimeZone("Europe/Madrid")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
    expect(isValidTimeZone(null)).toBe(false);
    expect(isValidTimeZone(undefined)).toBe(false);
    expect(isValidTimeZone(42)).toBe(false);
  });
});

describe("localTimeToUtc", () => {
  it("converts a fixed-offset zone (Buenos Aires UTC-3)", () => {
    expect(
      localTimeToUtc({ year: 2026, month: 10, day: 1, hour: 9 }, "America/Argentina/Buenos_Aires"),
    ).toEqual(new Date("2026-10-01T12:00:00.000Z"));
    expect(
      localTimeToUtc({ year: 2026, month: 9, day: 30, hour: 0 }, "America/Argentina/Buenos_Aires"),
    ).toEqual(new Date("2026-09-30T03:00:00.000Z"));
  });

  it("handles New York either side of the 2026 DST switches", () => {
    // DST starts 2026-03-08 02:00 local; ends 2026-11-01 02:00 local.
    expect(
      localTimeToUtc({ year: 2026, month: 3, day: 7, hour: 9 }, "America/New_York"),
    ).toEqual(new Date("2026-03-07T14:00:00.000Z")); // EST -5
    expect(
      localTimeToUtc({ year: 2026, month: 3, day: 8, hour: 9 }, "America/New_York"),
    ).toEqual(new Date("2026-03-08T13:00:00.000Z")); // EDT -4
    expect(
      localTimeToUtc({ year: 2026, month: 11, day: 1, hour: 0 }, "America/New_York"),
    ).toEqual(new Date("2026-11-01T04:00:00.000Z")); // still EDT at midnight
    expect(
      localTimeToUtc({ year: 2026, month: 11, day: 1, hour: 9 }, "America/New_York"),
    ).toEqual(new Date("2026-11-01T14:00:00.000Z")); // EST -5
  });

  it("handles Madrid around the 2026 DST switches", () => {
    // DST starts 2026-03-29 02:00 local; ends 2026-10-25 03:00 local.
    expect(
      localTimeToUtc({ year: 2026, month: 3, day: 29, hour: 0 }, "Europe/Madrid"),
    ).toEqual(new Date("2026-03-28T23:00:00.000Z")); // CET +1
    expect(
      localTimeToUtc({ year: 2026, month: 3, day: 29, hour: 9 }, "Europe/Madrid"),
    ).toEqual(new Date("2026-03-29T07:00:00.000Z")); // CEST +2
    expect(
      localTimeToUtc({ year: 2026, month: 10, day: 25, hour: 0 }, "Europe/Madrid"),
    ).toEqual(new Date("2026-10-24T22:00:00.000Z")); // CEST +2
    expect(
      localTimeToUtc({ year: 2026, month: 10, day: 25, hour: 9 }, "Europe/Madrid"),
    ).toEqual(new Date("2026-10-25T08:00:00.000Z")); // CET +1
  });

  it("normalizes day overflow so callers can subtract calendar days", () => {
    expect(
      localTimeToUtc({ year: 2026, month: 10, day: 1 - 2, hour: 9 }, "America/Argentina/Buenos_Aires"),
    ).toEqual(new Date("2026-09-29T12:00:00.000Z"));
  });

  it("resolves a nonexistent spring-forward local time to the instant after the gap", () => {
    // 02:30 on 2026-03-08 does not exist in New York.
    const result = localTimeToUtc({ year: 2026, month: 3, day: 8, hour: 2, minute: 30 }, "America/New_York");
    expect(result.getTime()).toBe(new Date("2026-03-08T07:30:00.000Z").getTime());
  });
});

describe("resolveDepartureTimeZone", () => {
  it("prefers the origin country zone", () => {
    expect(
      resolveDepartureTimeZone({ originCountryCode: "ar", browserTimeZone: "Europe/Madrid" }),
    ).toBe("America/Argentina/Buenos_Aires");
    expect(resolveDepartureTimeZone({ originCountryCode: "MX" })).toBe("America/Mexico_City");
  });

  it("falls back to a valid browser zone when the country is missing or unmapped", () => {
    expect(resolveDepartureTimeZone({ originCountryCode: "ES", browserTimeZone: "Europe/Madrid" })).toBe("Europe/Madrid");
    expect(resolveDepartureTimeZone({ browserTimeZone: "America/New_York" })).toBe("America/New_York");
  });

  it("ignores an invalid browser zone and falls back to Buenos Aires, logging once", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(resolveDepartureTimeZone({ browserTimeZone: "Not/AZone" })).toBe(DEFAULT_DEPARTURE_TIME_ZONE);
    expect(resolveDepartureTimeZone({})).toBe(DEFAULT_DEPARTURE_TIME_ZONE);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("resolveDepartureTimeZone in multi-zone countries (review R3-002)", () => {
  it("prefers a valid browser zone that belongs to the origin country", () => {
    expect(
      resolveDepartureTimeZone({ originCountryCode: "MX", browserTimeZone: "America/Tijuana" }),
    ).toBe("America/Tijuana");
    expect(
      resolveDepartureTimeZone({ originCountryCode: "br", browserTimeZone: "America/Manaus" }),
    ).toBe("America/Manaus");
    expect(
      resolveDepartureTimeZone({ originCountryCode: "CL", browserTimeZone: "America/Punta_Arenas" }),
    ).toBe("America/Punta_Arenas");
  });

  it("keeps the country's primary zone when the browser zone is elsewhere or invalid", () => {
    expect(
      resolveDepartureTimeZone({ originCountryCode: "MX", browserTimeZone: "Europe/Madrid" }),
    ).toBe("America/Mexico_City");
    expect(
      resolveDepartureTimeZone({ originCountryCode: "MX", browserTimeZone: "Not/AZone" }),
    ).toBe("America/Mexico_City");
  });

  it("keeps Buenos Aires for Argentina even from a provincial browser zone", () => {
    expect(
      resolveDepartureTimeZone({
        originCountryCode: "AR",
        browserTimeZone: "America/Argentina/Cordoba",
      }),
    ).toBe("America/Argentina/Buenos_Aires");
  });
});

describe("getBookingTimeZoneInputs", () => {
  it("prefers the picker's country code and always sends the browser zone", () => {
    const inputs = getBookingTimeZoneInputs({ countryCode: "uy", countryName: "Argentina" });
    expect(inputs.originCountryCode).toBe("UY");
    expect(isValidTimeZone(inputs.browserTimeZone)).toBe(true);
    expect(inputs.browserTimeZone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });

  it("derives the code from the country name when the picker code is unavailable (page reload)", () => {
    expect(getBookingTimeZoneInputs({ countryName: "Brasil" }).originCountryCode).toBe("BR");
    expect(getBookingTimeZoneInputs({ countryCode: "", countryName: "Chile" }).originCountryCode).toBe("CL");
  });

  it("omits the code when it cannot be resolved", () => {
    expect(getBookingTimeZoneInputs({ countryName: "Atlantis" })).not.toHaveProperty("originCountryCode");
  });
});
