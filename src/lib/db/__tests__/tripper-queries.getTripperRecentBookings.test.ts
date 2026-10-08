import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripRequest: { findMany: vi.fn() },
  },
}));

import { getTripperRecentBookings } from "../tripper-queries";
import { prisma } from "@/lib/prisma";

function row(overrides: Record<string, unknown>) {
  return {
    id: "t1",
    type: "couple",
    level: "essenza",
    status: "CONFIRMED",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    excuseKey: null,
    refineDetails: [],
    user: { id: "u1", name: "Ana", email: "ana@example.com" },
    experience: { id: "e1", title: "Beach", basePrice: 100 },
    payment: null,
    ...overrides,
  };
}

describe("getTripperRecentBookings — excuse fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps excuseKey, refineDetails and the traveler type", async () => {
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      row({ excuseKey: "beach", refineDetails: ["snorkel"] }),
    ]);
    const [booking] = await getTripperRecentBookings("tripper-1");
    expect(booking).toMatchObject({
      excuseKey: "beach",
      refineDetails: ["snorkel"],
      travelerType: "couple",
    });
  });

  it("uses the stored level as traveler type for XSED trips", async () => {
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      row({ type: "xsed", level: "solo", excuseKey: "x" }),
    ]);
    const [booking] = await getTripperRecentBookings("tripper-1");
    expect(booking.travelerType).toBe("solo");
  });

  it("returns a null excuse and empty details for legacy trips", async () => {
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      row({}),
    ]);
    const [booking] = await getTripperRecentBookings("tripper-1");
    expect(booking.excuseKey).toBeNull();
    expect(booking.refineDetails).toEqual([]);
  });
});
