import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/db/payment", () => ({
  findPaymentByStripeIntentId: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(),
}));

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

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { findPaymentByStripeIntentId } from "@/lib/db/payment";
import { prisma } from "@/lib/prisma";

type RouteModule = typeof import("../route");

// ── Fixtures ───────────────────────────────────────────────────────────────
const DAY_MS = 24 * 60 * 60 * 1000;

function makeTripRow() {
  return {
    id: "trip-1",
    userId: "buyer-1",
    startDate: new Date(Date.now() + 30 * DAY_MS),
    endDate: new Date(Date.now() + 34 * DAY_MS),
    travelersLockedAt: null,
    level: "essenza",
    nights: 4,
    originCity: "Buenos Aires",
    originCountry: "Argentina",
    pax: 3,
    paxDetails: { adults: 2, minors: 1 },
    type: "family",
    payment: { status: "APPROVED" },
    travelers: [
      {
        id: "trav-1",
        kind: "ADULT",
        status: "PENDING",
        fullName: null,
        email: null,
        idDocument: null,
        dateOfBirth: null,
        invitedAt: null,
        submittedAt: null,
        createdAt: new Date(),
      },
      {
        id: "trav-2",
        kind: "MINOR",
        status: "PENDING",
        fullName: null,
        email: null,
        idDocument: null,
        dateOfBirth: null,
        invitedAt: null,
        submittedAt: null,
        createdAt: new Date(),
      },
    ],
  };
}

function makeRequest() {
  return new NextRequest(
    "http://localhost/api/stripe/trip-summary?paymentIntentId=pi_123",
    { method: "GET" },
  );
}

describe("GET /api/stripe/trip-summary", () => {
  let GET: RouteModule["GET"];

  beforeEach(async () => {
    vi.resetAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeTripRow());

    const mod = await import("../route");
    GET = mod.GET;
  });

  it("includes paxDetails and roster in the trip payload", async () => {
    (
      findPaymentByStripeIntentId as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      amount: 1000,
      currency: "usd",
      userId: "buyer-1",
      stripePaymentIntentId: null,
      tripRequest: makeTripRow(),
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.trip.paxDetails).toEqual({ adults: 2, minors: 1 });
    expect(body.trip.roster).toBeDefined();
    expect(body.trip.roster.cap).toBe(2);
    expect(body.trip.roster.travelers).toHaveLength(2);
  });
});
