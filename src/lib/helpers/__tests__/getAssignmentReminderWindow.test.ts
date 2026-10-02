import { describe, expect, it } from "vitest";
import { getAssignmentReminderWindow } from "../getAssignmentReminderWindow";

const hour = 3_600_000;
// Sat 2026-10-10 from Argentina: reveals Thu 2026-10-08 09:00 ART.
const start = {
  startDate: new Date("2026-10-10T00:00:00Z"),
  departureTimeZone: "America/Argentina/Buenos_Aires",
};
const reveal = new Date("2026-10-08T12:00:00Z");

describe("reveal-relative assignment milestones", () => {
  it.each([
    [72 * hour + 1, null],
    [72 * hour, 72],
    [72 * hour - 1, 72],
    [48 * hour + 1, 72],
    [48 * hour, 48],
    [48 * hour - 1, 48],
    [24 * hour + 1, 48],
    [24 * hour, 24],
    [24 * hour - 1, 24],
    [1, 24],
    [0, null],
    [-1, null],
  ])(
    "selects the newest due milestone with %i ms remaining",
    (remaining, expected) => {
      const result = getAssignmentReminderWindow(
        start,
        new Date(+reveal - remaining),
      );
      expect(result?.milestoneHours ?? null).toBe(expected);
      if (expected) {
        expect(result?.revealAt).toEqual(reveal);
        expect(result?.expiresAt).toEqual(
          new Date(+reveal - Math.max(0, expected - 24) * hour),
        );
      }
    },
  );

  it("follows the trip's own departure zone", () => {
    expect(
      getAssignmentReminderWindow(
        { startDate: new Date("2027-01-01T00:00:00Z"), departureTimeZone: "Europe/Madrid" },
        new Date("2026-12-27T09:00:00Z"),
      ),
    ).toEqual({
      milestoneHours: 72,
      revealAt: new Date("2026-12-30T08:00:00Z"),
      expiresAt: new Date("2026-12-28T08:00:00Z"),
    });
  });

  it.each([null, { startDate: new Date("invalid") }])(
    "does not schedule a missing/invalid departure: %s",
    (date) => {
      expect(getAssignmentReminderWindow(date, reveal)).toBeNull();
    },
  );
});
