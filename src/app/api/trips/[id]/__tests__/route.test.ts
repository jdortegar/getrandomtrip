import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────────
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    tripRequest: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    tripDocument: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

// ── Imports ────────────────────────────────────────────────────────────────────
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

type RouteModule = typeof import("../route");

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeProps(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(method = "GET") {
  return new Request(`http://localhost/api/trips/trip-1`, { method }) as unknown as import("next/server").NextRequest;
}

const mockUser = { id: "user-1", email: "test@example.com" };
const mockExperience = {
  id: "exp-1",
  title: "Beach Adventure",
  itinerary: null,
  inclusions: null,
  exclusions: null,
  heroImage: "https://example.com/hero.jpg",
  destinationCity: "Tulum",
  destinationCountry: "Mexico",
};
const mockTrip = {
  id: "trip-1",
  userId: "user-1",
  status: "CONFIRMED",
  startDate: new Date("2026-08-01T00:00:00.000Z"),
  travelersLockedAt: null,
  payment: null,
  travelers: [],
  experience: mockExperience,
};

// ── Tests ──────────────────────────────────────────────────────────────────────
describe("GET /api/trips/[id]", () => {
  let GET: RouteModule["GET"];

  beforeEach(async () => {
    vi.resetAllMocks();
    const mod = await import("../route");
    GET = mod.GET;
  });

  it("returns 401 when session is missing", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await GET(makeRequest(), makeProps("trip-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when user not found", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await GET(makeRequest(), makeProps("trip-1"));
    expect(res.status).toBe(404);
  });

  it("returns 404 when trip not found", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await GET(makeRequest(), makeProps("trip-1"));
    expect(res.status).toBe(404);
  });

  it("returns 403 for an unrelated user (not the buyer, not a linked companion)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockTrip,
      userId: "other-user",
    });
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const res = await GET(makeRequest(), makeProps("trip-1"));
    expect(res.status).toBe(403);
  });

  it("returns 200 with experience including heroImage, destinationCity, destinationCountry", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTrip);
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const res = await GET(makeRequest(), makeProps("trip-1"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.trip).toBeDefined();
    expect(body.trip.experience.heroImage).toBe("https://example.com/hero.jpg");
    expect(body.trip.experience.destinationCity).toBe("Tulum");
    expect(body.trip.experience.destinationCountry).toBe("Mexico");
  });

  it("returns 200 for a companion linked via TripTraveler.userId to a trip bought by someone else", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockTrip,
      userId: "other-buyer",
      status: "REVEALED",
    });
    // canAccessTrip's count resolves >0 because a TripTraveler row links
    // this user to the trip, even though they are not the buyer.
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    (prisma.tripDocument.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const res = await GET(makeRequest(), makeProps("trip-1"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.trip).toBeDefined();
  });

  it("omits itinerary/inclusions/exclusions/documents for a CONFIRMED (pre-reveal) trip", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockTrip,
      status: "CONFIRMED",
    });
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const res = await GET(makeRequest(), makeProps("trip-1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.trip.experience.itinerary).toBeUndefined();
    expect(body.trip.experience.inclusions).toBeUndefined();
    expect(body.trip.experience.exclusions).toBeUndefined();
    expect(body.trip.documents).toBeUndefined();
  });

  it.each(["REVEALED", "COMPLETED", "CANCELLED"])(
    "includes fulfillment content for status=%s",
    async (status) => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { email: "test@example.com" },
      });
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...mockTrip,
        status,
        experience: {
          ...mockExperience,
          itinerary: [{ title: "Day 1", description: "Arrival", image: null }],
          inclusions: ["Breakfast"],
          exclusions: ["Flights"],
        },
      });
      (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
      (prisma.tripDocument.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const res = await GET(makeRequest(), makeProps("trip-1"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.trip.experience.itinerary).toBeDefined();
      expect(body.trip.experience.inclusions).toEqual(["Breakfast"]);
      expect(body.trip.experience.exclusions).toEqual(["Flights"]);
      expect(Array.isArray(body.trip.documents)).toBe(true);
    },
  );
});

describe("DELETE /api/trips/[id]", () => {
  let DELETE: RouteModule["DELETE"];

  beforeEach(async () => {
    vi.resetAllMocks();
    const mod = await import("../route");
    DELETE = mod.DELETE;
  });

  it("stays buyer-only: a companion linked via TripTraveler.userId still gets 403 — NOT routed through the shared read predicate", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockTrip,
      userId: "other-buyer",
    });

    const res = await DELETE(makeRequest("DELETE"), makeProps("trip-1"));

    expect(res.status).toBe(403);
    expect(prisma.tripRequest.delete).not.toHaveBeenCalled();
    // DELETE's guard must never call the shared companion-access predicate.
    expect(prisma.tripRequest.count).not.toHaveBeenCalled();
  });

  it("still allows the buyer to delete their own trip", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTrip,
    );
    (prisma.tripRequest.delete as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTrip,
    );

    const res = await DELETE(makeRequest("DELETE"), makeProps("trip-1"));

    expect(res.status).toBe(200);
    expect(prisma.tripRequest.delete).toHaveBeenCalledTimes(1);
  });
});
