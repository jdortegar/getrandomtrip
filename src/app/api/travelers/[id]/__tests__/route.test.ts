import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripTraveler: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    tripRequest: {
      count: vi.fn(),
    },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

type RouteModule = typeof import("../route");

// ── Helpers ────────────────────────────────────────────────────────────────
function makeProps(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/travelers/trav-1", {
    method: "PATCH",
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const futureTrip = {
  id: "trip-1",
  userId: "buyer-1",
  startDate: new Date(Date.now() + 30 * DAY_MS),
  travelersLockedAt: null,
};

const lockedTrip = {
  id: "trip-1",
  userId: "buyer-1",
  startDate: new Date(Date.now() + 2 * DAY_MS),
  travelersLockedAt: null,
};

function makeAdultRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "trav-1",
    kind: "ADULT" as const,
    status: "PENDING" as const,
    fullName: null,
    email: null,
    idDocument: null,
    dateOfBirth: null,
    invitedAt: null,
    submittedAt: null,
    tripRequest: futureTrip,
    ...overrides,
  };
}

function makeMinorRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "trav-2",
    kind: "MINOR" as const,
    status: "PENDING" as const,
    fullName: null,
    email: null,
    idDocument: null,
    dateOfBirth: null,
    invitedAt: null,
    submittedAt: null,
    tripRequest: futureTrip,
    ...overrides,
  };
}

describe("PATCH /api/travelers/[id]", () => {
  let PATCH: RouteModule["PATCH"];

  beforeEach(async () => {
    vi.resetAllMocks();
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    const mod = await import("../route");
    PATCH = mod.PATCH;
  });

  it("returns 401 when session is missing", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await PATCH(makeRequest({}), makeProps("trav-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when the traveler row does not exist", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    const res = await PATCH(makeRequest({}), makeProps("trav-1"));
    expect(res.status).toBe(404);
  });

  it("returns 403 when the session user has no access to the trip (not buyer or companion)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "someone-else" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeAdultRow());
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const res = await PATCH(makeRequest({}), makeProps("trav-1"));
    expect(res.status).toBe(403);
  });

  it("allows a companion (non-buyer with trip access) to save a row", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "companion-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeAdultRow());
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    (
      prisma.tripTraveler.update as ReturnType<typeof vi.fn>
    ).mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
      ...makeAdultRow(),
      ...data,
    }));

    const res = await PATCH(
      makeRequest({
        fullName: "Companion Traveler",
        email: "companion@example.com",
        idDocument: "ID789",
      }),
      makeProps("trav-1"),
    );

    expect(res.status).toBe(200);
  });

  it("returns 403 when the roster is locked (past cutoff)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeAdultRow({ tripRequest: lockedTrip }));

    const res = await PATCH(
      makeRequest({ fullName: "Bob" }),
      makeProps("trav-1"),
    );
    expect(res.status).toBe(403);
  });

  it("flips an adult row to COMPLETE when name+email+idDocument are all present", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeAdultRow());
    (
      prisma.tripTraveler.update as ReturnType<typeof vi.fn>
    ).mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
      ...makeAdultRow(),
      ...data,
    }));

    const res = await PATCH(
      makeRequest({
        fullName: "Bob Companion",
        email: "bob@example.com",
        idDocument: "ID123",
      }),
      makeProps("trav-1"),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.traveler.status).toBe("COMPLETE");

    const args = (prisma.tripTraveler.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(args.data.status).toBe("COMPLETE");
  });

  it("leaves an adult row's status unchanged (not COMPLETE) when a required field is still missing", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeAdultRow());
    (
      prisma.tripTraveler.update as ReturnType<typeof vi.fn>
    ).mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
      ...makeAdultRow(),
      ...data,
    }));

    const res = await PATCH(
      makeRequest({ fullName: "Bob Companion" }),
      makeProps("trav-1"),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.traveler.status).toBe("PENDING");
  });

  it("flips a minor row to COMPLETE when name+dateOfBirth+idDocument are all present", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeMinorRow());
    (
      prisma.tripTraveler.update as ReturnType<typeof vi.fn>
    ).mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
      ...makeMinorRow(),
      ...data,
    }));

    const res = await PATCH(
      makeRequest({
        fullName: "Tiny Traveler",
        dateOfBirth: "2015-01-01",
        idDocument: "ID456",
      }),
      makeProps("trav-2"),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.traveler.status).toBe("COMPLETE");
  });

  it("rejects an incomplete minor save with an inline error and does not persist", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeMinorRow());

    const res = await PATCH(
      makeRequest({ fullName: "Tiny Traveler", dateOfBirth: "2015-01-01" }),
      makeProps("trav-2"),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
  });

  it("never downgrades an already-COMPLETE row", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(
      makeAdultRow({
        status: "COMPLETE",
        fullName: "Bob Companion",
        email: "bob@example.com",
        idDocument: "ID123",
        submittedAt: new Date(),
      }),
    );
    (
      prisma.tripTraveler.update as ReturnType<typeof vi.fn>
    ).mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
      ...makeAdultRow({ status: "COMPLETE" }),
      ...data,
    }));

    const res = await PATCH(
      makeRequest({ fullName: "Bob Companion Updated" }),
      makeProps("trav-1"),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.traveler.status).toBe("COMPLETE");
  });
});
