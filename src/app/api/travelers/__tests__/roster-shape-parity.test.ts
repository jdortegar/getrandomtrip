import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
// Guards the shape-drift risk called out in design.md: `trip-summary` and
// `/api/trips/[id]` are two independent endpoints that must embed the exact
// same `getRosterForTrip` output under a `roster` key — no route may build
// a traveler object inline.

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
    user: { findUnique: vi.fn() },
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

const DAY_MS = 24 * 60 * 60 * 1000;

function makeTripRow() {
  return {
    id: "trip-1",
    userId: "buyer-1",
    status: "CONFIRMED",
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
    experience: null,
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
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
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
        createdAt: new Date("2026-01-01T00:00:01.000Z"),
      },
    ],
  };
}

describe("roster shape parity between trip-summary and /api/trips/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1", email: "buyer@example.com" },
    });
    (
      prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeTripRow());
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "buyer-1",
      email: "buyer@example.com",
    });
  });

  it("returns byte-identical `roster` from both read surfaces for the same trip", async () => {
    (
      findPaymentByStripeIntentId as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      amount: 1000,
      currency: "usd",
      userId: "buyer-1",
      stripePaymentIntentId: null,
      tripRequest: makeTripRow(),
    });

    const { GET: tripSummaryGET } = await import(
      "../../stripe/trip-summary/route"
    );
    const { GET: tripByIdGET } = await import("../../trips/[id]/route");

    const summaryRes = await tripSummaryGET(
      new NextRequest(
        "http://localhost/api/stripe/trip-summary?paymentIntentId=pi_123",
      ),
    );
    const summaryBody = await summaryRes.json();

    const tripRes = await tripByIdGET(
      new NextRequest("http://localhost/api/trips/trip-1"),
      { params: Promise.resolve({ id: "trip-1" }) },
    );
    const tripBody = await tripRes.json();

    expect(summaryRes.status).toBe(200);
    expect(tripRes.status).toBe(200);
    expect(summaryBody.trip.roster).toBeDefined();
    expect(tripBody.trip.roster).toBeDefined();
    expect(summaryBody.trip.roster).toEqual(tripBody.trip.roster);
  });
});
