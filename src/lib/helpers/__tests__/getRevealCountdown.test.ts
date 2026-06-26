import { describe, it, expect } from "vitest";
import {
  getRevealAt,
  getNotifyAt,
  isInRevealWindow,
  isInNotifyWindow,
  getRevealCountdown,
} from "../getRevealCountdown";

// Fixed reference: startDate is 2025-07-01T12:00:00.000Z
const START_DATE = new Date("2025-07-01T12:00:00.000Z");
// revealAt = 2025-06-29T12:00:00.000Z  (startDate - 48h)
// notifyAt = 2025-06-28T12:00:00.000Z  (startDate - 72h)

describe("getRevealAt", () => {
  it("returns startDate minus 48 hours", () => {
    const result = getRevealAt(START_DATE);
    const expected = new Date("2025-06-29T12:00:00.000Z");
    expect(result.getTime()).toBe(expected.getTime());
  });

  it("triangulation — different start date", () => {
    const start = new Date("2025-01-05T00:00:00.000Z");
    const result = getRevealAt(start);
    const expected = new Date("2025-01-03T00:00:00.000Z");
    expect(result.getTime()).toBe(expected.getTime());
  });
});

describe("getNotifyAt", () => {
  it("returns startDate minus 72 hours", () => {
    const result = getNotifyAt(START_DATE);
    const expected = new Date("2025-06-28T12:00:00.000Z");
    expect(result.getTime()).toBe(expected.getTime());
  });
});

describe("isInRevealWindow", () => {
  it("returns true when now is exactly at revealAt boundary", () => {
    const revealAt = new Date("2025-06-29T12:00:00.000Z");
    expect(isInRevealWindow(START_DATE, revealAt)).toBe(true);
  });

  it("returns true when now is between revealAt and startDate", () => {
    const now = new Date("2025-06-30T00:00:00.000Z");
    expect(isInRevealWindow(START_DATE, now)).toBe(true);
  });

  it("returns false when now is before revealAt", () => {
    const now = new Date("2025-06-29T11:59:59.000Z");
    expect(isInRevealWindow(START_DATE, now)).toBe(false);
  });

  it("returns false when now is at or after startDate", () => {
    const now = new Date("2025-07-01T12:00:00.000Z");
    expect(isInRevealWindow(START_DATE, now)).toBe(false);
  });
});

describe("isInNotifyWindow", () => {
  it("returns true when now is exactly at notifyAt boundary", () => {
    const notifyAt = new Date("2025-06-28T12:00:00.000Z");
    expect(isInNotifyWindow(START_DATE, notifyAt)).toBe(true);
  });

  it("returns true when now is between notifyAt and startDate", () => {
    const now = new Date("2025-06-30T00:00:00.000Z");
    expect(isInNotifyWindow(START_DATE, now)).toBe(true);
  });

  it("returns false when now is before notifyAt", () => {
    const now = new Date("2025-06-28T11:59:59.000Z");
    expect(isInNotifyWindow(START_DATE, now)).toBe(false);
  });
});

describe("getRevealCountdown", () => {
  it("returns revealed: false with correct days and hours when in the future", () => {
    // now is 1 day and 6 hours before revealAt
    // revealAt = 2025-06-29T12:00:00Z
    // now      = 2025-06-28T06:00:00Z  → 30h before revealAt
    const now = new Date("2025-06-28T06:00:00.000Z");
    const result = getRevealCountdown(START_DATE, now);

    expect(result.revealed).toBe(false);
    expect(result.days).toBe(1);
    expect(result.hours).toBe(6);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
  });

  it("returns revealed: true when now is past revealAt", () => {
    // now is after revealAt (revealAt = 2025-06-29T12:00:00Z)
    const now = new Date("2025-06-29T13:00:00.000Z");
    const result = getRevealCountdown(START_DATE, now);

    expect(result.revealed).toBe(true);
    expect(result.days).toBe(0);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
  });

  it("returns revealed: true when now equals revealAt exactly (boundary)", () => {
    const revealAt = new Date("2025-06-29T12:00:00.000Z");
    const result = getRevealCountdown(START_DATE, revealAt);

    expect(result.revealed).toBe(true);
  });

  it("computes minutes and seconds correctly", () => {
    // now is 90 seconds before revealAt
    const revealAt = new Date("2025-06-29T12:00:00.000Z");
    const now = new Date(revealAt.getTime() - 90 * 1000);
    const result = getRevealCountdown(START_DATE, now);

    expect(result.revealed).toBe(false);
    expect(result.days).toBe(0);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(1);
    expect(result.seconds).toBe(30);
  });

  it("UTC timezone correctness — same instant, different representations", () => {
    // Use explicit UTC timestamps to ensure no local-tz contamination
    const utcStart = new Date(Date.UTC(2025, 11, 25, 0, 0, 0)); // 2025-12-25T00:00:00Z
    const utcRevealAt = new Date(Date.UTC(2025, 11, 22, 0, 0, 0)); // 2025-12-23T00:00:00Z  (startDate - 72h)
    // 72h before: 2025-12-22T00:00:00Z → actually revealAt is -48h = 2025-12-23T00:00:00Z
    const expectedRevealAt = new Date(Date.UTC(2025, 11, 23, 0, 0, 0));
    const actual = getRevealAt(utcStart);
    expect(actual.getTime()).toBe(expectedRevealAt.getTime());

    // now = 2h before revealAt
    const now = new Date(expectedRevealAt.getTime() - 2 * 60 * 60 * 1000);
    const result = getRevealCountdown(utcStart, now);
    expect(result.revealed).toBe(false);
    expect(result.days).toBe(0);
    expect(result.hours).toBe(2);
  });
});
