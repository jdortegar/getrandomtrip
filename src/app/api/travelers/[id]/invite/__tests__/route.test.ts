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
    tripRequest: {
      count: vi.fn(),
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
  endDate: new Date(Date.now() + 4 * DAY_MS),
  travelersLockedAt: null,
};

const endedTrip = {
  id: "trip-1",
  userId: "buyer-1",
  startDate: new Date(Date.now() - 5 * DAY_MS),
  endDate: new Date(Date.now() - 2 * DAY_MS),
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
    userId: null,
    tripRequest: futureTrip,
    ...overrides,
  };
}

describe("POST /api/travelers/[id]/invite", () => {
  let POST: RouteModule["POST"];

  beforeEach(async () => {
    vi.resetAllMocks();
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    const mod = await import("../route");
    POST = mod.POST;
  });

  it("returns 401 when session is missing", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await POST(makeRequest(), makeProps("trav-1"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when the session user has no access to the trip (not buyer or companion)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "someone-else" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeAdultRow());
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const res = await POST(makeRequest(), makeProps("trav-1"));
    expect(res.status).toBe(403);
  });

  it("never lets a companion (non-buyer with trip access) invite anyone (T6)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "companion-1" },
    });
    (prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeAdultRow(),
    );
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const res = await POST(makeRequest(), makeProps("trav-1"));

    expect(res.status).toBe(403);
    expect(issueTravelerInvite).not.toHaveBeenCalled();
    expect(sendTravelerInviteEmail).not.toHaveBeenCalled();
  });

  it("allows re-inviting a fully populated, unlinked adult after the cutoff while the trip has not ended (T1)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(
        makeAdultRow({
          tripRequest: lockedTrip,
          fullName: "Saved Name",
          idDocument: "SAVED",
          status: "INVITED",
          userId: null,
        }),
      )
      .mockResolvedValueOnce(makeAdultRow({ status: "INVITED" }));
    (issueTravelerInvite as ReturnType<typeof vi.fn>).mockResolvedValue("late");

    const res = await POST(makeRequest(), makeProps("trav-1"));

    expect(res.status).toBe(200);
    expect(issueTravelerInvite).toHaveBeenCalledWith("trav-1", "INVITED");
    expect(sendTravelerInviteEmail).toHaveBeenCalledWith("trav-1", "late");
  });

  it("returns 403 ended once the trip has ended (T1)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeAdultRow({ tripRequest: endedTrip }));

    const res = await POST(makeRequest(), makeProps("trav-1"));

    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("ended");
    expect(issueTravelerInvite).not.toHaveBeenCalled();
  });

  it("returns 409 already_joined when the companion already linked an account (T1)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeAdultRow({ userId: "companion-1", status: "COMPLETE" }));

    const res = await POST(makeRequest(), makeProps("trav-1"));

    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("already_joined");
    expect(issueTravelerInvite).not.toHaveBeenCalled();
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
    expect(issueTravelerInvite).toHaveBeenCalledWith("trav-1", "PENDING");
    expect(sendTravelerInviteEmail).toHaveBeenCalledWith(
      "trav-1",
      "plaintext-token",
    );

    const body = await res.json();
    expect(body.traveler.status).toBe("INVITED");
  });
});

it("can invite an incomplete adult after cutoff", async () => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "buyer-1" } });
  vi.mocked(prisma.tripRequest.count).mockResolvedValue(1);
  vi.mocked(prisma.tripTraveler.findUnique).mockResolvedValue(makeAdultRow({ tripRequest: lockedTrip }) as never);
  vi.mocked(issueTravelerInvite).mockResolvedValue("late-token");
  const { POST } = await import("../route");
  expect((await POST(makeRequest(), makeProps("trav-1"))).status).toBe(200);
  expect(sendTravelerInviteEmail).toHaveBeenCalledWith("trav-1", "late-token");
});
