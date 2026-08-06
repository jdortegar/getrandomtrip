import { describe, it, expect, vi, beforeEach } from "vitest";
import { TripRequestStatus } from "@prisma/client";

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripRequest: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  tripFamilyOf,
  tripFamilyWhere,
  isExpiredPendingPayment,
  NON_TERMINAL_TRIP_STATUSES,
  findActiveTripRequest,
  revertExpiredPendingPayment,
  revertExpiredPendingPaymentsForUser,
} from "../tripRequest";

// ── tripFamilyOf ─────────────────────────────────────────────────────────────
describe("tripFamilyOf", () => {
  it("classifies 'xsed' as the xsed family", () => {
    expect(tripFamilyOf("xsed")).toBe("xsed");
  });

  it("classifies 'family' as journey — regression test for the naming collision", () => {
    expect(tripFamilyOf("family")).toBe("journey");
  });

  it("classifies 'couple' as journey", () => {
    expect(tripFamilyOf("couple")).toBe("journey");
  });

  it("classifies 'solo' as journey", () => {
    expect(tripFamilyOf("solo")).toBe("journey");
  });

  it("classifies an empty string as journey", () => {
    expect(tripFamilyOf("")).toBe("journey");
  });

  it("classifies undefined as journey", () => {
    expect(tripFamilyOf(undefined)).toBe("journey");
  });

  it("classifies null as journey", () => {
    expect(tripFamilyOf(null)).toBe("journey");
  });
});

// ── tripFamilyWhere ──────────────────────────────────────────────────────────
describe("tripFamilyWhere", () => {
  it("returns the exact 'xsed' string for the xsed family", () => {
    expect(tripFamilyWhere("xsed")).toBe("xsed");
  });

  it("returns a not-equal-xsed filter for the journey family", () => {
    expect(tripFamilyWhere("journey")).toEqual({ not: "xsed" });
  });
});

// ── NON_TERMINAL_TRIP_STATUSES ───────────────────────────────────────────────
describe("NON_TERMINAL_TRIP_STATUSES", () => {
  it("contains exactly DRAFT, SAVED, PENDING_PAYMENT", () => {
    expect(NON_TERMINAL_TRIP_STATUSES).toEqual([
      TripRequestStatus.DRAFT,
      TripRequestStatus.SAVED,
      TripRequestStatus.PENDING_PAYMENT,
    ]);
  });
});

// ── isExpiredPendingPayment (pure) ───────────────────────────────────────────
describe("isExpiredPendingPayment", () => {
  const now = new Date("2026-08-06T12:00:00.000Z");

  it("is true when PENDING_PAYMENT and expiresAt is strictly in the past", () => {
    const trip = {
      id: "t1",
      status: TripRequestStatus.PENDING_PAYMENT,
      payment: { expiresAt: new Date("2026-08-06T11:59:59.000Z") },
    };
    expect(isExpiredPendingPayment(trip, now)).toBe(true);
  });

  it("is false when expiresAt is still in the future", () => {
    const trip = {
      id: "t2",
      status: TripRequestStatus.PENDING_PAYMENT,
      payment: { expiresAt: new Date("2026-08-06T12:00:01.000Z") },
    };
    expect(isExpiredPendingPayment(trip, now)).toBe(false);
  });

  it("is false when expiresAt exactly equals now (boundary, not expired)", () => {
    const trip = {
      id: "t3",
      status: TripRequestStatus.PENDING_PAYMENT,
      payment: { expiresAt: new Date("2026-08-06T12:00:00.000Z") },
    };
    expect(isExpiredPendingPayment(trip, now)).toBe(false);
  });

  it("is false when payment.expiresAt is null", () => {
    const trip = {
      id: "t4",
      status: TripRequestStatus.PENDING_PAYMENT,
      payment: { expiresAt: null },
    };
    expect(isExpiredPendingPayment(trip, now)).toBe(false);
  });

  it("is false when there is no payment row at all", () => {
    const trip = {
      id: "t5",
      status: TripRequestStatus.PENDING_PAYMENT,
      payment: null,
    };
    expect(isExpiredPendingPayment(trip, now)).toBe(false);
  });

  it("is false when status is not PENDING_PAYMENT, even with an expired date", () => {
    const trip = {
      id: "t6",
      status: TripRequestStatus.SAVED,
      payment: { expiresAt: new Date("2026-08-06T11:59:59.000Z") },
    };
    expect(isExpiredPendingPayment(trip, now)).toBe(false);
  });
});

// ── findActiveTripRequest (mocked Prisma) ────────────────────────────────────
describe("findActiveTripRequest", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("queries journey family with type: { not: 'xsed' } and newest-first ordering", async () => {
    (prisma.tripRequest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      { id: "trip-1", status: TripRequestStatus.SAVED, tripperId: null },
    );

    const result = await findActiveTripRequest("user-1", "journey");

    expect(prisma.tripRequest.findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        type: { not: "xsed" },
        status: { in: NON_TERMINAL_TRIP_STATUSES },
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true, status: true, tripperId: true },
    });
    expect(result).toEqual({
      id: "trip-1",
      status: TripRequestStatus.SAVED,
      tripperId: null,
    });
  });

  it("queries xsed family with type: 'xsed'", async () => {
    (prisma.tripRequest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const result = await findActiveTripRequest("user-1", "xsed");

    expect(prisma.tripRequest.findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        type: "xsed",
        status: { in: NON_TERMINAL_TRIP_STATUSES },
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true, status: true, tripperId: true },
    });
    expect(result).toBeNull();
  });
});

// ── revertExpiredPendingPayment (mocked Prisma) ──────────────────────────────
describe("revertExpiredPendingPayment", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("persists a revert to SAVED exactly once when expired, and returns SAVED", async () => {
    (prisma.tripRequest.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      { count: 1 },
    );
    const now = new Date("2026-08-06T12:00:00.000Z");
    const trip = {
      id: "trip-1",
      status: TripRequestStatus.PENDING_PAYMENT,
      payment: { expiresAt: new Date("2026-08-06T11:00:00.000Z") },
    };

    const effective = await revertExpiredPendingPayment(trip, now);

    expect(prisma.tripRequest.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.tripRequest.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["trip-1"] }, status: TripRequestStatus.PENDING_PAYMENT },
      data: { status: TripRequestStatus.SAVED },
    });
    expect(effective).toBe(TripRequestStatus.SAVED);
  });

  it("does not write and returns the original status when not expired", async () => {
    const now = new Date("2026-08-06T12:00:00.000Z");
    const trip = {
      id: "trip-2",
      status: TripRequestStatus.PENDING_PAYMENT,
      payment: { expiresAt: new Date("2026-08-06T13:00:00.000Z") },
    };

    const effective = await revertExpiredPendingPayment(trip, now);

    expect(prisma.tripRequest.updateMany).not.toHaveBeenCalled();
    expect(effective).toBe(TripRequestStatus.PENDING_PAYMENT);
  });
});

// ── revertExpiredPendingPaymentsForUser (mocked Prisma) ──────────────────────
describe("revertExpiredPendingPaymentsForUser", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("skips updateMany entirely when findMany returns no expired candidates", async () => {
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      [],
    );

    const count = await revertExpiredPendingPaymentsForUser("user-1");

    expect(prisma.tripRequest.updateMany).not.toHaveBeenCalled();
    expect(count).toBe(0);
  });

  it("reverts every expired PENDING_PAYMENT row owned by the user", async () => {
    const now = new Date("2026-08-06T12:00:00.000Z");
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "trip-1",
        status: TripRequestStatus.PENDING_PAYMENT,
        payment: { expiresAt: new Date("2026-08-06T11:00:00.000Z") },
      },
      {
        id: "trip-2",
        status: TripRequestStatus.PENDING_PAYMENT,
        payment: { expiresAt: new Date("2026-08-06T13:00:00.000Z") },
      },
    ]);
    (prisma.tripRequest.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      { count: 1 },
    );

    const count = await revertExpiredPendingPaymentsForUser("user-1", now);

    expect(prisma.tripRequest.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", status: TripRequestStatus.PENDING_PAYMENT },
      select: { id: true, status: true, payment: { select: { expiresAt: true } } },
    });
    expect(prisma.tripRequest.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["trip-1"] }, status: TripRequestStatus.PENDING_PAYMENT },
      data: { status: TripRequestStatus.SAVED },
    });
    expect(count).toBe(1);
  });
});
