import { describe, expect, it } from "vitest";
import { buildRevealAt } from "../revealAt";

describe("buildRevealAt", () => {
  it("returns a Date 48 hours before the given ISO date string", () => {
    const tripDate = "2025-06-07T12:00:00.000Z";
    const result = buildRevealAt(tripDate);
    expect(result).not.toBeNull();
    const expectedMs = new Date("2025-06-07T12:00:00.000Z").getTime() - 48 * 60 * 60 * 1000;
    expect(result!.getTime()).toBe(expectedMs);
  });

  it("returns a Date 48 hours before a different date (triangulation)", () => {
    const tripDate = "2025-01-05T00:00:00.000Z";
    const result = buildRevealAt(tripDate);
    expect(result).not.toBeNull();
    const expected = new Date("2025-01-03T00:00:00.000Z");
    expect(result!.getTime()).toBe(expected.getTime());
  });

  it("returns null when tripDate is undefined", () => {
    const result = buildRevealAt(undefined);
    expect(result).toBeNull();
  });

  it("returns null when tripDate is empty string", () => {
    const result = buildRevealAt("");
    expect(result).toBeNull();
  });
});
