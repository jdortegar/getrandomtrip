import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({
  prisma: { tripRequest: { findFirst: vi.fn() } },
}));
vi.mock("@/lib/db/tripRequest", () => ({
  findActiveTripRequest: vi.fn(),
  tripFamilyOf: (type: string) => (type === "xsed" ? "xsed" : "journey"),
  NON_TERMINAL_TRIP_STATUSES: ["DRAFT", "SAVED", "PENDING_PAYMENT"],
}));
vi.mock("@/lib/pricing/tripper-price-overrides.server", () => ({
  loadTripperPriceOverrides: vi.fn(),
}));
import { prisma } from "@/lib/prisma";
import { findActiveTripRequest } from "@/lib/db/tripRequest";
import { loadTripperPriceOverrides } from "@/lib/pricing/tripper-price-overrides.server";
import { resolveJourneyPricing } from "../journey-pricing.server";
const currentOverrides = { couple: { essenza: 350 } };
const storedOverrides = { couple: { essenza: 1000 } };
beforeEach(() => vi.resetAllMocks());
describe("booking-aware Journey price context", () => {
  it("uses exactly the owned resumed booking's attribution, not the current cookie", async () => {
    vi.mocked(prisma.tripRequest.findFirst).mockResolvedValue({
      id: "owned",
      tripperId: "original",
    } as never);
    vi.mocked(loadTripperPriceOverrides).mockResolvedValue(storedOverrides);
    expect(
      await resolveJourneyPricing({
        userId: "buyer",
        tripRequestId: "owned",
        type: "couple",
        currentOverrides,
      }),
    ).toEqual({ bookingBound: true, overrides: storedOverrides });
    expect(prisma.tripRequest.findFirst).toHaveBeenCalledWith({
      where: {
        id: "owned",
        userId: "buyer",
        status: { in: ["DRAFT", "SAVED", "PENDING_PAYMENT"] },
      },
      select: { id: true, tripperId: true },
    });
    expect(findActiveTripRequest).not.toHaveBeenCalled();
    expect(loadTripperPriceOverrides).toHaveBeenCalledWith("original");
  });
});

it.each(["couple", "solo", "family"])(
  "matches POST's implicit journey slot for %s",
  async (type) => {
    vi.mocked(findActiveTripRequest).mockResolvedValue({
      id: "active",
      tripperId: "original",
      status: "SAVED",
    });
    vi.mocked(loadTripperPriceOverrides).mockResolvedValue(storedOverrides);
    expect(
      await resolveJourneyPricing({ userId: "buyer", type, currentOverrides }),
    ).toEqual({ bookingBound: true, overrides: storedOverrides });
    expect(findActiveTripRequest).toHaveBeenCalledWith("buyer", "journey");
  },
);
it("keeps the XSED slot independent", async () => {
  vi.mocked(findActiveTripRequest).mockResolvedValue(null);
  expect(
    await resolveJourneyPricing({
      userId: "buyer",
      type: "xsed",
      currentOverrides: null,
    }),
  ).toEqual({ bookingBound: false, overrides: null });
  expect(findActiveTripRequest).toHaveBeenCalledWith("buyer", "xsed");
});
it("uses current context for a truly new booking, without reading another tripper", async () => {
  vi.mocked(findActiveTripRequest).mockResolvedValue(null);
  expect(
    await resolveJourneyPricing({
      userId: "buyer",
      type: "couple",
      currentOverrides,
    }),
  ).toEqual({ bookingBound: false, overrides: currentOverrides });
  expect(loadTripperPriceOverrides).not.toHaveBeenCalled();
});
it("never falls through from unavailable explicit ID to a different active row", async () => {
  vi.mocked(prisma.tripRequest.findFirst).mockResolvedValue(null);
  expect(
    await resolveJourneyPricing({
      userId: "buyer",
      tripRequestId: "unowned-or-terminal",
      type: "couple",
      currentOverrides,
    }),
  ).toBeNull();
  expect(findActiveTripRequest).not.toHaveBeenCalled();
  expect(loadTripperPriceOverrides).not.toHaveBeenCalled();
});
it("does not read an anonymous visitor's explicit booking ID", async () => {
  expect(
    await resolveJourneyPricing({
      tripRequestId: "private",
      type: "couple",
      currentOverrides,
    }),
  ).toBeNull();
  expect(prisma.tripRequest.findFirst).not.toHaveBeenCalled();
});
it("an explicit null-attribution booking stays catalog, unlike implicit upsert stamping", async () => {
  vi.mocked(prisma.tripRequest.findFirst).mockResolvedValue({
    id: "owned",
    tripperId: null,
  } as never);
  vi.mocked(findActiveTripRequest).mockResolvedValue({
    id: "owned",
    tripperId: null,
    status: "DRAFT",
  });
  expect(
    await resolveJourneyPricing({
      userId: "buyer",
      tripRequestId: "owned",
      type: "couple",
      currentOverrides,
    }),
  ).toEqual({ bookingBound: true, overrides: null });
  expect(
    await resolveJourneyPricing({
      userId: "buyer",
      type: "couple",
      currentOverrides,
    }),
  ).toEqual({ bookingBound: true, overrides: currentOverrides });
});
it("does not persist attribution or apply new liveness policy to an existing booking", async () => {
  vi.mocked(findActiveTripRequest).mockResolvedValue({
    id: "active",
    tripperId: "historical",
    status: "SAVED",
  });
  vi.mocked(loadTripperPriceOverrides).mockResolvedValue(null);
  expect(
    await resolveJourneyPricing({
      userId: "buyer",
      type: "couple",
      currentOverrides,
    }),
  ).toEqual({ bookingBound: true, overrides: null });
});
