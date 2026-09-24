import { describe, expect, it } from "vitest";
import {
  getCountdownTarget,
  getNotifyTargetUtcOffset,
  isLocalWindowOpen,
  isWithinServerOuterBoundary,
} from "../window";

const BUENOS_AIRES = "America/Argentina/Buenos_Aires"; // UTC-3

describe("XSED drop window (Sunday 18:00–22:00 local)", () => {
  it.each([
    ["2026-09-27T20:59:00Z", false], // 17:59 local
    ["2026-09-27T21:00:00Z", true], // 18:00 local
    ["2026-09-28T00:59:00Z", true], // 21:59 local
    ["2026-09-28T01:00:00Z", false], // 22:00 local
  ])("at %s the Buenos Aires window open is %s", (iso, open) => {
    expect(isLocalWindowOpen(BUENOS_AIRES, new Date(iso))).toBe(open);
  });

  it("counts down to 18:00 local while closed and to 22:00 local while open", () => {
    expect(
      getCountdownTarget(BUENOS_AIRES, new Date("2026-09-27T15:00:00Z")),
    ).toEqual(new Date("2026-09-27T21:00:00Z"));
    expect(
      getCountdownTarget(BUENOS_AIRES, new Date("2026-09-27T22:00:00Z")),
    ).toEqual(new Date("2026-09-28T01:00:00Z"));
  });
});

describe("isWithinServerOuterBoundary covers every supported timezone", () => {
  it("opens by 18:00 in the easternmost zone (Noronha, UTC-2)", () => {
    expect(isLocalWindowOpen("America/Noronha", new Date("2026-09-27T20:00:00Z"))).toBe(true);
    expect(isWithinServerOuterBoundary(new Date("2026-09-27T20:00:00Z"))).toBe(true);
    expect(isWithinServerOuterBoundary(new Date("2026-09-27T19:59:00Z"))).toBe(false);
  });

  it("stays open until 22:00 in the westernmost zone (Tijuana, UTC-8 in winter)", () => {
    const lastMinute = new Date("2026-12-07T05:59:00Z"); // Sun 21:59 in Tijuana
    expect(isLocalWindowOpen("America/Tijuana", lastMinute)).toBe(true);
    expect(isWithinServerOuterBoundary(lastMinute)).toBe(true);
    expect(isWithinServerOuterBoundary(new Date("2026-12-07T06:00:00Z"))).toBe(false);
  });
});

describe("getNotifyTargetUtcOffset (email at 17:50 local, 10 minutes before 18:00)", () => {
  it.each([
    ["2026-09-27T19:50:00Z", -2], // 17:50 in Noronha
    ["2026-09-27T20:50:00Z", -3], // 17:50 in Buenos Aires
    ["2026-09-27T23:50:00Z", -6], // 17:50 in Mexico City
    ["2026-09-28T00:50:00Z", -7], // Sunday 17:50 in Hermosillo (Monday UTC)
    ["2026-09-28T01:50:00Z", -8], // Sunday 17:50 in Tijuana winter (Monday UTC)
  ])("at %s targets UTC%i", (iso, offset) => {
    expect(getNotifyTargetUtcOffset(new Date(iso))).toBe(offset);
  });

  it.each([
    "2026-09-27T17:50:00Z", // too early for any supported zone
    "2026-09-28T19:50:00Z", // Monday evening UTC
    "2026-09-29T20:50:00Z", // Tuesday
  ])("targets nobody at %s", (iso) => {
    expect(getNotifyTargetUtcOffset(new Date(iso))).toBeNull();
  });
});
