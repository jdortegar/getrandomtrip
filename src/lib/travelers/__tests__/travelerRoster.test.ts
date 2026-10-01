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
  serializeTravelerForCompanion,
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
      joined: false,
    });
  });

  it("derives `joined` from the account link without exposing the user id (T8)", () => {
    const row = {
      id: "t-3",
      kind: "ADULT" as const,
      status: "COMPLETE" as const,
      fullName: "Linked",
      email: "linked@example.com",
      idDocument: "ID",
      dateOfBirth: null,
      invitedAt: null,
      submittedAt: null,
    };

    expect(serializeTraveler({ ...row, userId: "user-9" })).toMatchObject({ joined: true });
    expect(serializeTraveler({ ...row, userId: null })).toMatchObject({ joined: false });
    expect(JSON.stringify(serializeTraveler({ ...row, userId: "user-9" }))).not.toContain("user-9");
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

describe("serializeTravelerForCompanion (T6)", () => {
  const row = (id: string, userId: string | null) => ({
    id,
    kind: "ADULT" as const,
    status: "COMPLETE" as const,
    fullName: `Name ${id}`,
    email: `${id}@example.com`,
    idDocument: `DOC-${id}`,
    dateOfBirth: new Date("1990-01-01T00:00:00.000Z"),
    invitedAt: new Date("2026-01-01T00:00:00.000Z"),
    submittedAt: new Date("2026-01-02T00:00:00.000Z"),
    userId,
  });

  it("keeps the viewer's own row complete and marks it as theirs", () => {
    const dto = serializeTravelerForCompanion(row("me", "viewer-1"), "viewer-1");

    expect(dto).toMatchObject({
      id: "me",
      fullName: "Name me",
      email: "me@example.com",
      idDocument: "DOC-me",
      dateOfBirth: "1990-01-01T00:00:00.000Z",
      isSelf: true,
    });
  });

  it("reduces another traveler to a name: no email, ID document, DOB, invite or link info", () => {
    const dto = serializeTravelerForCompanion(row("other", "someone-else"), "viewer-1");

    expect(dto).toEqual({
      id: "other",
      kind: "ADULT",
      status: "COMPLETE",
      fullName: "Name other",
      email: null,
      idDocument: null,
      dateOfBirth: null,
      invitedAt: null,
      submittedAt: null,
      joined: false,
    });
    expect(JSON.stringify(dto)).not.toMatch(/DOC-other|other@example.com|1990|someone-else/);
  });

  it("never treats an unlinked row as the viewer's", () => {
    expect(serializeTravelerForCompanion(row("x", null), "viewer-1")).not.toHaveProperty("isSelf");
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
        userId: "buyer-1",
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

    const roster = await getRosterForTrip("trip-1", "buyer-1");

    expect(prisma.tripRequest.findUnique).toHaveBeenCalledTimes(2);
    expect(roster.locked).toBe(false);
    expect(roster.cap).toBe(1);
    expect(roster.submitted).toBe(1);
    expect(roster.travelers).toHaveLength(1);
    expect(roster.travelers[0].id).toBe("t-1");
    expect(roster.deadline).toBe(
      new Date(startDate.getTime() - 7 * DAY_MS).toISOString(),
    );
    expect(roster.startDate).toBe(startDate.toISOString());
  });

  it("counts an INVITED row that already has every detail as submitted (T3 status semantics)", async () => {
    const startDate = new Date(Date.now() + 30 * DAY_MS);
    const row = (id: string, status: string, idDocument: string | null) => ({
      id, kind: "ADULT", status, fullName: "N", email: `${id}@x.com`, idDocument,
      dateOfBirth: null, invitedAt: new Date(), submittedAt: null,
    });
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: "trip-1", paxDetails: { adults: 4 }, payment: { status: "APPROVED" }, travelers: [] })
      .mockResolvedValueOnce({
        id: "trip-1", userId: "buyer-1", startDate, travelersLockedAt: null,
        travelers: [row("a", "INVITED", "ID"), row("b", "INVITED", null), row("c", "COMPLETE", "ID")],
      });

    const roster = await getRosterForTrip("trip-1", "buyer-1");

    expect(roster.cap).toBe(3);
    expect(roster.submitted).toBe(2);
  });

  it("returns the full roster and `viewerRole: buyer` to the buyer", async () => {
    const startDate = new Date(Date.now() + 30 * DAY_MS);
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: "trip-1", paxDetails: { adults: 2 }, payment: { status: "APPROVED" }, travelers: [] })
      .mockResolvedValueOnce({
        id: "trip-1", userId: "buyer-1", startDate, travelersLockedAt: null,
        travelers: [{ id: "a", kind: "ADULT", status: "INVITED", fullName: "Ann", email: "ann@x.com", idDocument: "ID-A", dateOfBirth: null, invitedAt: new Date(), submittedAt: null, userId: "u-ann" }],
      });

    const roster = await getRosterForTrip("trip-1", "buyer-1");

    expect(roster.viewerRole).toBe("buyer");
    expect(roster.travelers[0]).toMatchObject({ email: "ann@x.com", idDocument: "ID-A", joined: true });
    expect(roster.travelers[0]).not.toHaveProperty("isSelf");
  });

  it("gives a companion only their own full row, names for the rest, and the buyer-side progress count (T6)", async () => {
    const startDate = new Date(Date.now() + 30 * DAY_MS);
    const row = (id: string, userId: string | null) => ({
      id, kind: "ADULT", status: "COMPLETE", fullName: `N-${id}`, email: `${id}@x.com`, idDocument: `ID-${id}`,
      dateOfBirth: null, invitedAt: new Date(), submittedAt: new Date(), userId,
    });
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: "trip-1", paxDetails: { adults: 3 }, payment: { status: "APPROVED" }, travelers: [] })
      .mockResolvedValueOnce({
        id: "trip-1", userId: "buyer-1", startDate, travelersLockedAt: null,
        travelers: [row("me", "viewer-1"), row("other", "u-other")],
      });

    const roster = await getRosterForTrip("trip-1", "viewer-1");

    expect(roster.viewerRole).toBe("companion");
    expect(roster.submitted).toBe(2);
    expect(roster.travelers[0]).toMatchObject({ id: "me", email: "me@x.com", idDocument: "ID-me", isSelf: true });
    expect(roster.travelers[1]).toMatchObject({ id: "other", fullName: "N-other", email: null, idDocument: null, dateOfBirth: null });
    expect(JSON.stringify(roster)).not.toContain("ID-other");
  });

  it("returns an empty locked-false roster when the trip does not exist", async () => {
    (
      prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    const roster = await getRosterForTrip("missing-trip", "buyer-1");

    expect(roster).toEqual({
      deadline: null,
      startDate: null,
      locked: false,
      cap: 0,
      submitted: 0,
      travelers: [],
    });
  });
});

describe("XSED cutoff regression", () => {
  it("reopens a paid Sunday-to-Saturday trip despite a legacy T-7d stamp", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-28T12:00:00Z"));
    try {
      const trip = { userId: "buyer-1", type: "xsed", startDate: new Date("2026-10-03T00:00:00Z"), travelersLockedAt: new Date("2026-09-27T15:00:00Z"), payment: { status: "APPROVED" }, paxDetails: { adults: 2 }, travelers: [] };
      vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue(trip as never);
      const roster = await getRosterForTrip("trip", "buyer-1");
      expect(roster.locked).toBe(false);
      expect(roster.deadline).toBe("2026-09-30T00:00:00.000Z");
    } finally { vi.useRealTimers(); }
  });
  it("protects populated fields at exactly 72 hours, not one millisecond earlier", () => {
    vi.useFakeTimers();
    const trip = { type: "XSED", startDate: new Date("2026-10-03T00:00:00Z"), travelersLockedAt: null };
    try {
      vi.setSystemTime(new Date("2026-09-29T23:59:59.999Z"));
      expect(isRosterLocked(trip)).toBe(false);
      vi.setSystemTime(new Date("2026-09-30T00:00:00Z"));
      expect(isRosterLocked(trip)).toBe(true);
    } finally { vi.useRealTimers(); }
  });
});
