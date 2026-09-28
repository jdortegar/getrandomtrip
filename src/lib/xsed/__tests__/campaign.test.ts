import { describe, expect, it } from "vitest";
import {
  DEFAULT_XSED_CAMPAIGN_START_DATE,
  getXsedCampaignWeek,
  isCampaignDate,
} from "../campaign";

describe("XSED campaign date", () => {
  it("uses the fixed launch date, not today's date", () => {
    expect(DEFAULT_XSED_CAMPAIGN_START_DATE).toBe("2026-09-27");
  });

  it.each(["2026-09-27", "2024-02-29", "2000-02-29"])(
    "accepts a real date-only value: %s",
    (value) => expect(isCampaignDate(value)).toBe(true),
  );

  it.each([
    null,
    undefined,
    20260927,
    "",
    "2026-9-27",
    "2026-02-29",
    "2026-04-31",
    "1900-02-29",
    "2026-00-01",
    "2026-13-01",
    "2026-09-00",
    "2026-09-32",
    "0000-01-01",
    "2026-09-27T00:00:00Z",
  ])("rejects malformed or impossible dates: %s", (value) => {
    expect(isCampaignDate(value)).toBe(false);
  });
});

describe("XSED active or upcoming campaign editions", () => {
  it.each([
    ["2026-09-01T12:00:00Z", 1],
    ["2026-09-27T03:00:00Z", 1],
    ["2026-09-27T20:59:59Z", 1],
    ["2026-09-27T21:00:00Z", 1],
    ["2026-09-28T00:59:59.999Z", 1],
    ["2026-09-28T01:00:00Z", 2],
    ["2026-09-28T15:00:00Z", 2],
    ["2026-10-04T21:00:00Z", 2],
    ["2026-10-05T00:59:59.999Z", 2],
    ["2026-10-05T01:00:00Z", 3],
  ])("calculates %s in Buenos Aires as edition %i", (instant, week) => {
    expect(getXsedCampaignWeek("2026-09-27", new Date(instant))).toBe(week);
  });

  it("uses the first Sunday on or after the administrator's start date as edition 1", () => {
    expect(
      getXsedCampaignWeek("2026-09-30", new Date("2026-10-04T21:00:00Z")),
    ).toBe(1);
    expect(
      getXsedCampaignWeek("2026-09-30", new Date("2026-10-05T01:00:00Z")),
    ).toBe(2);
  });

  it.each([
    ["America/Argentina/Buenos_Aires", "2026-09-28T01:00:00Z", 2],
    ["America/Mexico_City", "2026-09-28T01:00:00Z", 1],
    ["America/Mexico_City", "2026-09-28T03:59:59.999Z", 1],
    ["America/Mexico_City", "2026-09-28T04:00:00Z", 2],
  ])("matches the local countdown in %s at %s", (tz, instant, week) => {
    expect(getXsedCampaignWeek("2026-09-27", new Date(instant), tz)).toBe(week);
  });

  it("handles year and leap-day boundaries using calendar days", () => {
    expect(
      getXsedCampaignWeek("2026-12-27", new Date("2026-12-28T01:00:00Z")),
    ).toBe(2);
    expect(
      getXsedCampaignWeek("2024-02-25", new Date("2024-02-26T01:00:00Z")),
    ).toBe(2);
  });

  it("does not silently calculate from invalid configuration", () => {
    expect(() => getXsedCampaignWeek("2026-02-30")).toThrow(RangeError);
  });
});
