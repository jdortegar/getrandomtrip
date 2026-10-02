import { describe, it, expect } from "vitest";
import {
  getDepartureAt,
  getRevealAt,
  getNotifyAt,
  isInRevealWindow,
  isInNotifyWindow,
  getRevealCountdown,
  getDepartureCountdown,
  getCalendarDaysUntilDeparture,
} from "../getRevealCountdown";

const BA = "America/Argentina/Buenos_Aires";
// Trip dates are calendar dates stored at UTC midnight: Sat 2026-10-03.
const TRIP = { startDate: new Date("2026-10-03T00:00:00.000Z"), departureTimeZone: BA };
// departureAt = 2026-10-03T03:00Z (00:00 ART)
// revealAt    = 2026-10-01T12:00Z (Thu 09:00 ART)
// notifyAt    = 2026-09-28T12:00Z (revealAt - 72h)
const REVEAL_AT = new Date("2026-10-01T12:00:00.000Z");
const DEPARTURE_AT = new Date("2026-10-03T03:00:00.000Z");

describe("getDepartureAt", () => {
  it("is 00:00 of the start calendar date in the departure zone", () => {
    expect(getDepartureAt(TRIP)).toEqual(DEPARTURE_AT);
  });

  it("uses the UTC calendar date of startDate, ignoring the time part", () => {
    expect(
      getDepartureAt({ startDate: new Date("2026-10-03T21:30:00.000Z"), departureTimeZone: BA }),
    ).toEqual(DEPARTURE_AT);
  });

  it("falls back to Buenos Aires when the zone is missing (legacy rows)", () => {
    expect(getDepartureAt({ startDate: TRIP.startDate })).toEqual(DEPARTURE_AT);
    expect(getDepartureAt({ startDate: TRIP.startDate, departureTimeZone: null })).toEqual(DEPARTURE_AT);
  });

  it("follows other zones, including DST", () => {
    expect(
      getDepartureAt({ startDate: new Date("2026-10-03T00:00:00Z"), departureTimeZone: "Europe/Madrid" }),
    ).toEqual(new Date("2026-10-02T22:00:00.000Z"));
    expect(
      getDepartureAt({ startDate: new Date("2026-11-02T00:00:00Z"), departureTimeZone: "America/New_York" }),
    ).toEqual(new Date("2026-11-02T05:00:00.000Z"));
  });
});

describe("getRevealAt", () => {
  it("is 09:00 departure-local two calendar days before departure (Sat trip from AR reveals Thu 09:00 ART)", () => {
    expect(getRevealAt(TRIP)).toEqual(REVEAL_AT);
  });

  it("stays 09:00 local across a DST switch between reveal and departure", () => {
    // Madrid DST ends Sun 2026-10-25 03:00. Trip Mon 2026-10-26 -> reveal Sat 10-24 09:00 CEST (+2).
    expect(
      getRevealAt({ startDate: new Date("2026-10-26T00:00:00Z"), departureTimeZone: "Europe/Madrid" }),
    ).toEqual(new Date("2026-10-24T07:00:00.000Z"));
  });

  it("crosses month boundaries by calendar day", () => {
    expect(
      getRevealAt({ startDate: new Date("2026-11-01T00:00:00Z"), departureTimeZone: BA }),
    ).toEqual(new Date("2026-10-30T12:00:00.000Z"));
  });
});

describe("getNotifyAt", () => {
  it("returns revealAt minus 72 hours", () => {
    expect(getNotifyAt(TRIP)).toEqual(new Date("2026-09-28T12:00:00.000Z"));
  });
});

describe("isInRevealWindow", () => {
  it("is true from revealAt (inclusive) until departure", () => {
    expect(isInRevealWindow(TRIP, REVEAL_AT)).toBe(true);
    expect(isInRevealWindow(TRIP, new Date("2026-10-02T12:00:00.000Z"))).toBe(true);
  });

  it("is false before revealAt and from departure on", () => {
    expect(isInRevealWindow(TRIP, new Date(REVEAL_AT.getTime() - 1000))).toBe(false);
    expect(isInRevealWindow(TRIP, DEPARTURE_AT)).toBe(false);
  });
});

describe("isInNotifyWindow", () => {
  it("is true between notifyAt (inclusive) and revealAt", () => {
    expect(isInNotifyWindow(TRIP, new Date("2026-09-28T12:00:00.000Z"))).toBe(true);
    expect(isInNotifyWindow(TRIP, new Date("2026-09-30T00:00:00.000Z"))).toBe(true);
  });

  it("is false before notifyAt and at revealAt", () => {
    expect(isInNotifyWindow(TRIP, new Date("2026-09-28T11:59:59.000Z"))).toBe(false);
    expect(isInNotifyWindow(TRIP, REVEAL_AT)).toBe(false);
  });
});

describe("getRevealCountdown", () => {
  it("counts down to the reveal moment", () => {
    const now = new Date(REVEAL_AT.getTime() - 30 * 3600 * 1000);
    expect(getRevealCountdown(TRIP, now)).toEqual({
      revealed: false,
      days: 1,
      hours: 6,
      minutes: 0,
      seconds: 0,
    });
  });

  it("computes minutes and seconds", () => {
    const now = new Date(REVEAL_AT.getTime() - 90 * 1000);
    const result = getRevealCountdown(TRIP, now);
    expect(result).toMatchObject({ revealed: false, minutes: 1, seconds: 30 });
  });

  it("is revealed at and after revealAt", () => {
    expect(getRevealCountdown(TRIP, REVEAL_AT).revealed).toBe(true);
    expect(getRevealCountdown(TRIP, new Date("2026-10-02T00:00:00Z"))).toEqual({
      revealed: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });
});

describe("getDepartureCountdown", () => {
  it("counts down to local-midnight departure, not UTC midnight", () => {
    const now = new Date(DEPARTURE_AT.getTime() - 5 * 24 * 3600 * 1000);
    const result = getDepartureCountdown(TRIP, now);
    expect(result.elapsed).toBe(false);
    expect(result.days).toBe(5);
  });

  it("is elapsed from departureAt on and one second before shows 1 second", () => {
    expect(getDepartureCountdown(TRIP, DEPARTURE_AT).elapsed).toBe(true);
    const result = getDepartureCountdown(TRIP, new Date(DEPARTURE_AT.getTime() - 1000));
    expect(result).toEqual({ elapsed: false, days: 0, hours: 0, minutes: 0, seconds: 1 });
  });

  it("is on a different axis than the reveal countdown", () => {
    const now = new Date("2026-10-02T12:00:00.000Z");
    expect(getDepartureCountdown(TRIP, now).elapsed).toBe(false);
    expect(getRevealCountdown(TRIP, now).revealed).toBe(true);
  });
});

describe("getCalendarDaysUntilDeparture", () => {
  it("regression: departure tomorrow at UTC midnight, less than 24h away this afternoon — must read 1, not 0", () => {
    // startDate = 2025-07-02T00:00:00Z (a day after START_DATE's date).
    // now = 2025-07-01T15:00:00Z — only 9 exact hours before startDate, so
    // getDepartureCountdown(...).days floors to 0 (same bug this helper
    // exists to avoid): the hero pill would wrongly read "Departs today"
    // when the calendar gap is clearly 1 day (today is Jul 1, departure Jul 2).
    const startDate = new Date("2025-07-02T00:00:00.000Z");
    const now = new Date("2025-07-01T15:00:00.000Z");

    expect(getCalendarDaysUntilDeparture(startDate, now)).toBe(1);
  });

  it("returns 0 when departure and now share the same UTC calendar day", () => {
    const startDate = new Date("2025-07-01T22:00:00.000Z");
    const now = new Date("2025-07-01T08:00:00.000Z");

    expect(getCalendarDaysUntilDeparture(startDate, now)).toBe(0);
  });

  it("returns a multi-day gap correctly", () => {
    const startDate = new Date("2025-07-05T00:00:00.000Z");
    const now = new Date("2025-07-01T23:00:00.000Z");

    expect(getCalendarDaysUntilDeparture(startDate, now)).toBe(4);
  });
});
