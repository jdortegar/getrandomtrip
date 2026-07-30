import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripRequest: {
      findUnique: vi.fn(),
    },
    tripTraveler: {
      createMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  computeTravelerCap,
  isRosterLocked,
  ensureRoster,
  getRosterForTrip,
  serializeTraveler,
} from "../travelerRoster";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("computeTravelerCap", () => {
  it("computes adultRows = adults - 1 and minorRows = minors for a normal party", () => {
    expect(computeTravelerCap({ adults: 2, minors: 1 })).toEqual({
      adultRows: 1,
      minorRows: 1,
    });
  });

  it("treats missing adults/minors as 0 rather than throwing", () => {
    expect(computeTravelerCap({})).toEqual({ adultRows: 0, minorRows: 0 });
  });

  it("treats non-numeric adults/minors as 0", () => {
    expect(
      computeTravelerCap({ adults: "two", minors: null }),
    ).toEqual({ adultRows: 0, minorRows: 0 });
  });

  it("never throws for null/undefined paxDetails", () => {
    expect(() => computeTravelerCap(null)).not.toThrow();
    expect(() => computeTravelerCap(undefined)).not.toThrow();
    expect(computeTravelerCap(null)).toEqual({ adultRows: 0, minorRows: 0 });
  });

  it("clamps adultRows at 0 for a solo traveler (adults: 1)", () => {
    expect(computeTravelerCap({ adults: 1, minors: 0 })).toEqual({
      adultRows: 0,
      minorRows: 0,
    });
  });
});

describe("isRosterLocked", () => {
  it("returns true when travelersLockedAt is already stamped", () => {
    expect(
      isRosterLocked({
        startDate: new Date(Date.now() + 30 * DAY_MS),
        travelersLockedAt: new Date(),
      }),
    ).toBe(true);
  });

  it("returns true at the exact T-7d boundary", () => {
    expect(
      isRosterLocked({
        startDate: new Date(Date.now() + 7 * DAY_MS),
        travelersLockedAt: null,
      }),
    ).toBe(true);
  });

  it("returns false before the T-7d cutoff", () => {
    expect(
      isRosterLocked({
        startDate: new Date(Date.now() + 8 * DAY_MS),
        travelersLockedAt: null,
      }),
    ).toBe(false);
  });

  it("returns false when there is no startDate and no lock stamp", () => {
    expect(isRosterLocked({ startDate: null, travelersLockedAt: null })).toBe(
      false,
    );
  });
});

describe("ensureRoster", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is a no-op when the trip's payment is not APPROVED", async () => {
    (
      prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trip-1",
      paxDetails: { adults: 2, minors: 1 },
      payment: { status: "PENDING" },
      travelers: [],
    });

    await ensureRoster("trip-1");

    expect(prisma.tripTraveler.createMany).not.toHaveBeenCalled();
  });

  it("is a no-op when the trip has no payment at all", async () => {
    (
      prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trip-1",
      paxDetails: { adults: 2, minors: 1 },
      payment: null,
      travelers: [],
    });

    await ensureRoster("trip-1");

    expect(prisma.tripTraveler.createMany).not.toHaveBeenCalled();
  });

  it("creates ADULT rows first then MINOR rows matching the computed cap for a paid trip", async () => {
    (
      prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trip-1",
      paxDetails: { adults: 3, minors: 1 },
      payment: { status: "APPROVED" },
      travelers: [],
    });

    await ensureRoster("trip-1");

    expect(prisma.tripTraveler.createMany).toHaveBeenCalledTimes(1);
    const args = (prisma.tripTraveler.createMany as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(args.data).toEqual([
      { tripRequestId: "trip-1", kind: "ADULT" },
      { tripRequestId: "trip-1", kind: "ADULT" },
      { tripRequestId: "trip-1", kind: "MINOR" },
    ]);
  });

  it("is idempotent — a second call creates nothing when rows already match the cap", async () => {
    (
      prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "trip-1",
      paxDetails: { adults: 2, minors: 1 },
      payment: { status: "APPROVED" },
      travelers: [
        { id: "t-1", kind: "ADULT" },
        { id: "t-2", kind: "MINOR" },
      ],
    });

    await ensureRoster("trip-1");

    expect(prisma.tripTraveler.createMany).not.toHaveBeenCalled();
  });
});

describe("serializeTraveler", () => {
  it("is the only place a row becomes a TravelerDTO, converting dates to ISO strings", () => {
    const dob = new Date("2010-05-01T00:00:00.000Z");
    const invitedAt = new Date("2026-01-01T00:00:00.000Z");
    const dto = serializeTraveler({
      id: "t-1",
      kind: "MINOR",
      status: "PENDING",
      fullName: "Kid Name",
      email: null,
      idDocument: "ID123",
      dateOfBirth: dob,
      invitedAt,
      submittedAt: null,
    });

    expect(dto).toEqual({
      id: "t-1",
      kind: "MINOR",
      status: "PENDING",
      fullName: "Kid Name",
      email: null,
      idDocument: "ID123",
      dateOfBirth: dob.toISOString(),
      invitedAt: invitedAt.toISOString(),
      submittedAt: null,
    });
  });

  it("returns null for unset date fields", () => {
    const dto = serializeTraveler({
      id: "t-2",
      kind: "ADULT",
      status: "PENDING",
      fullName: null,
      email: null,
      idDocument: null,
      dateOfBirth: null,
      invitedAt: null,
      submittedAt: null,
    });

    expect(dto.dateOfBirth).toBeNull();
    expect(dto.invitedAt).toBeNull();
    expect(dto.submittedAt).toBeNull();
  });
});

describe("getRosterForTrip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls ensureRoster (via the same findUnique-driven flow) then returns the shared roster shape", async () => {
    const startDate = new Date(Date.now() + 30 * DAY_MS);
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        id: "trip-1",
        paxDetails: { adults: 2, minors: 0 },
        payment: { status: "APPROVED" },
        travelers: [],
      })
      .mockResolvedValueOnce({
        id: "trip-1",
        startDate,
        travelersLockedAt: null,
        travelers: [
          {
            id: "t-1",
            kind: "ADULT",
            status: "COMPLETE",
            fullName: "Buyer",
            email: "buyer@example.com",
            idDocument: "ID1",
            dateOfBirth: null,
            invitedAt: null,
            submittedAt: new Date(),
          },
        ],
      });

    const roster = await getRosterForTrip("trip-1");

    expect(prisma.tripRequest.findUnique).toHaveBeenCalledTimes(2);
    expect(roster.locked).toBe(false);
    expect(roster.cap).toBe(1);
    expect(roster.submitted).toBe(1);
    expect(roster.travelers).toHaveLength(1);
    expect(roster.travelers[0].id).toBe("t-1");
    expect(roster.deadline).toBe(
      new Date(startDate.getTime() - 7 * DAY_MS).toISOString(),
    );
  });

  it("returns an empty locked-false roster when the trip does not exist", async () => {
    (
      prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    const roster = await getRosterForTrip("missing-trip");

    expect(roster).toEqual({
      deadline: null,
      locked: false,
      cap: 0,
      submitted: 0,
      travelers: [],
    });
  });
});
