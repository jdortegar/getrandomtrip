import { describe, expect, it } from "vitest";
import { buildTripSupportMessage, canSendTripSupport } from "../tripSupportHelpers";

describe("buildTripSupportMessage", () => {
  it("puts the human message first, followed by a footer with tripId and destination", () => {
    const result = buildTripSupportMessage("Can you confirm my transfer time?", {
      destination: "Mendoza, Argentina",
      startDate: "2026-08-22T00:00:00.000Z",
      tripId: "trip-123",
    });

    expect(result.startsWith("Can you confirm my transfer time?")).toBe(true);
    expect(result).toContain("Trip ID: trip-123");
    expect(result).toContain("Destination: Mendoza, Argentina");
    expect(result).toContain("Departure: 2026-08-22T00:00:00.000Z");
  });

  it("omits the destination line when destination is null", () => {
    const result = buildTripSupportMessage("Question", {
      destination: null,
      startDate: "2026-08-22T00:00:00.000Z",
      tripId: "trip-123",
    });

    expect(result).not.toContain("Destination:");
    expect(result).toContain("Trip ID: trip-123");
  });

  it("omits the departure line when startDate is null", () => {
    const result = buildTripSupportMessage("Question", {
      destination: "Mendoza, Argentina",
      startDate: null,
      tripId: "trip-123",
    });

    expect(result).not.toContain("Departure:");
    expect(result).toContain("Destination: Mendoza, Argentina");
  });

  it("always includes the tripId line", () => {
    const result = buildTripSupportMessage("Question", {
      destination: null,
      startDate: null,
      tripId: "trip-999",
    });

    expect(result).toContain("Trip ID: trip-999");
  });
});

describe("canSendTripSupport", () => {
  it("is false when the message is empty", () => {
    expect(canSendTripSupport("", false)).toBe(false);
  });

  it("is false when the message is whitespace only", () => {
    expect(canSendTripSupport("   ", false)).toBe(false);
  });

  it("is false while sending, even with valid content", () => {
    expect(canSendTripSupport("Hello", true)).toBe(false);
  });

  it("is true with non-blank content while not sending", () => {
    expect(canSendTripSupport("Hello", false)).toBe(true);
  });
});
