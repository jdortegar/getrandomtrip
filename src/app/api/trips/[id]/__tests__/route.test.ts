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
    },
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
  payment: null,
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

  it("returns 403 when user does not own the trip", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockTrip,
      userId: "other-user",
    });

    const res = await GET(makeRequest(), makeProps("trip-1"));
    expect(res.status).toBe(403);
  });

  it("returns 200 with experience including heroImage, destinationCity, destinationCountry", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTrip);

    const res = await GET(makeRequest(), makeProps("trip-1"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.trip).toBeDefined();
    expect(body.trip.experience.heroImage).toBe("https://example.com/hero.jpg");
    expect(body.trip.experience.destinationCity).toBe("Tulum");
    expect(body.trip.experience.destinationCountry).toBe("Mexico");
  });
});
