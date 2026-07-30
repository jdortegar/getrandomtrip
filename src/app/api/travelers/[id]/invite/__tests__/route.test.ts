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
    },
  },
}));

vi.mock("@/lib/travelers/travelerInviteTokens", () => ({
  issueTravelerInvite: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendTravelerInviteEmail: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { issueTravelerInvite } from "@/lib/travelers/travelerInviteTokens";
import { sendTravelerInviteEmail } from "@/lib/email";

type RouteModule = typeof import("../route");

// ── Helpers ────────────────────────────────────────────────────────────────
function makeProps(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest() {
  return new Request("http://localhost/api/travelers/trav-1/invite", {
    method: "POST",
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
    email: "bob@example.com",
    idDocument: null,
    dateOfBirth: null,
    invitedAt: null,
    submittedAt: null,
    tripRequest: futureTrip,
    ...overrides,
  };
}

describe("POST /api/travelers/[id]/invite", () => {
  let POST: RouteModule["POST"];

  beforeEach(async () => {
    vi.resetAllMocks();
    const mod = await import("../route");
    POST = mod.POST;
  });

  it("returns 401 when session is missing", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await POST(makeRequest(), makeProps("trav-1"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when the session user does not own the trip", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "someone-else" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeAdultRow());

    const res = await POST(makeRequest(), makeProps("trav-1"));
    expect(res.status).toBe(403);
  });

  it("returns 403 when the roster is locked", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeAdultRow({ tripRequest: lockedTrip }));

    const res = await POST(makeRequest(), makeProps("trav-1"));
    expect(res.status).toBe(403);
  });

  it("returns 400 for a MINOR row", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeAdultRow({ kind: "MINOR" }));

    const res = await POST(makeRequest(), makeProps("trav-1"));
    expect(res.status).toBe(400);
    expect(issueTravelerInvite).not.toHaveBeenCalled();
  });

  it("returns 400 when the adult row has no email", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeAdultRow({ email: null }));

    const res = await POST(makeRequest(), makeProps("trav-1"));
    expect(res.status).toBe(400);
    expect(issueTravelerInvite).not.toHaveBeenCalled();
  });

  it("issues the invite, sends the email, and returns status INVITED for a valid adult row", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(makeAdultRow())
      .mockResolvedValueOnce(makeAdultRow({ status: "INVITED", invitedAt: new Date() }));
    (issueTravelerInvite as ReturnType<typeof vi.fn>).mockResolvedValue(
      "plaintext-token",
    );

    const res = await POST(makeRequest(), makeProps("trav-1"));

    expect(res.status).toBe(200);
    expect(issueTravelerInvite).toHaveBeenCalledWith("trav-1");
    expect(sendTravelerInviteEmail).toHaveBeenCalledWith("trav-1");

    const body = await res.json();
    expect(body.traveler.status).toBe("INVITED");
  });
});
