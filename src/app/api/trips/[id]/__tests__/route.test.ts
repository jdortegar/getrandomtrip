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

vi.mock("@/lib/db/withDocumentCascadeCleanup", () => ({ withDocumentCascadeCleanup: vi.fn() }));

// ── Imports ────────────────────────────────────────────────────────────────────
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { withDocumentCascadeCleanup } from "@/lib/db/withDocumentCascadeCleanup";
const transactionDelete = vi.fn();

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
  type: "couple",
  level: "essenza",
  tripperId: null,
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
    vi.mocked(withDocumentCascadeCleanup).mockImplementation(async (_db, _scope, work) => work({ tripRequest: { delete: transactionDelete } } as never));
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
    expect(prisma.tripRequest.delete).not.toHaveBeenCalled();
    expect(transactionDelete).toHaveBeenCalledWith({ where: { id: "trip-1" } });
    expect(withDocumentCascadeCleanup).toHaveBeenCalledWith(prisma, { kind: "trip", ownerId: "user-1", tripRequestId: "trip-1" }, expect.any(Function));
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });
  it.each(["cleanup", "cascade", "scope"])("fails safely on %s errors", async stage => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { email: "test@example.com" } });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
    vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue(mockTrip as never);
    const error = new Error(stage === "scope" ? "DOCUMENT_LOCK_SCOPE_MISMATCH" : "postgres://private-secret");
    if (stage === "cascade") transactionDelete.mockRejectedValue(error);
    else vi.mocked(withDocumentCascadeCleanup).mockRejectedValue(error);
    const response = await DELETE(makeRequest("DELETE"), makeProps("trip-1"));
    expect(response.status).toBe(stage === "scope" ? 409 : 503);
    expect(await response.json()).toEqual({ error: stage === "scope" ? "trip_conflict" : "delete_unavailable" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(prisma.tripRequest.delete).not.toHaveBeenCalled();
    if (stage !== "cascade") expect(transactionDelete).not.toHaveBeenCalled();
  });
  it.each(["session", "user", "trip"])("does not enter cleanup for missing %s", async stage => {
    vi.mocked(getServerSession).mockResolvedValue(stage === "session" ? null : { user: { email: "test@example.com" } });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(stage === "user" ? null : mockUser as never);
    vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue(null);
    const response = await DELETE(makeRequest("DELETE"), makeProps("trip-1"));
    expect(response.status).toBe(stage === "session" ? 401 : 404);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(withDocumentCascadeCleanup).not.toHaveBeenCalled();
  });

});
