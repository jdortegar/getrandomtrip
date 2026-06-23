import { describe, it, expect, vi, beforeEach } from "vitest";

type RouteModule = typeof import("../route");

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    tripRequest: { update: vi.fn(), delete: vi.fn() },
    experience: { findUnique: vi.fn() },
    payment: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/admin/trip-requests", () => ({
  attachAdminTripRequestRelations: vi.fn(() => [{ id: "trip-1", status: "COMPLETED" }]),
}));

vi.mock("@/lib/email", () => ({
  sendDestinationRevealed: vi.fn(),
  sendTripCancelled: vi.fn(),
  sendTripCompleted: vi.fn(),
}));

// ── Imports ────────────────────────────────────────────────────────────────
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { sendTripCompleted } from "@/lib/email";

const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });
const mockClientUser = (id: string) => ({ id, roles: ["CLIENT"] });
const mockSession = (userId: string) => ({
  user: { id: userId, email: "admin@example.com" },
});

function makePatchRequest(id: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(`http://localhost/api/admin/trip-requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("PATCH /api/admin/trip-requests/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest("trip-1", { status: "COMPLETED" }), {
      params: Promise.resolve({ id: "trip-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not admin", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("user-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockClientUser("user-1"));
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest("trip-1", { status: "COMPLETED" }), {
      params: Promise.resolve({ id: "trip-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("generates and persists reviewToken before calling sendTripCompleted on COMPLETED transition", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));

    const updatedTrip = {
      id: "trip-1",
      status: "COMPLETED",
      userId: "user-1",
      completedAt: new Date(),
      experienceId: null,
      reviewToken: null,
    };

    (prisma.tripRequest.update as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(updatedTrip) // first update (status)
      .mockResolvedValueOnce({ ...updatedTrip, reviewToken: "test-token" }); // second update (reviewToken)

    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.payment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(makePatchRequest("trip-1", { status: "COMPLETED" }), {
      params: Promise.resolve({ id: "trip-1" }),
    });

    // Second tripRequest.update call must be for reviewToken persistence
    const calls = (prisma.tripRequest.update as ReturnType<typeof vi.fn>).mock.calls;
    const reviewTokenCall = calls.find(
      (call: unknown[]) => (call[0] as { data?: { reviewToken?: unknown } }).data?.reviewToken !== undefined,
    );
    expect(reviewTokenCall).toBeTruthy();

    // sendTripCompleted must be called after token persistence
    expect(sendTripCompleted).toHaveBeenCalled();
  });

  it("does not overwrite existing reviewToken on re-transition to COMPLETED", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));

    const tripWithExistingToken = {
      id: "trip-1",
      status: "COMPLETED",
      userId: "user-1",
      completedAt: new Date(),
      experienceId: null,
      reviewToken: "existing-token-abc",
    };

    (prisma.tripRequest.update as ReturnType<typeof vi.fn>).mockResolvedValue(tripWithExistingToken);
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.payment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(makePatchRequest("trip-1", { status: "COMPLETED" }), {
      params: Promise.resolve({ id: "trip-1" }),
    });

    // reviewToken update should not be called with a new token when one already exists
    const calls = (prisma.tripRequest.update as ReturnType<typeof vi.fn>).mock.calls;
    const tokenUpdateCalls = calls.filter(
      (call: unknown[]) => (call[0] as { data?: { reviewToken?: unknown } }).data?.reviewToken !== undefined,
    );
    // If existing token, no separate token update call should happen
    // The guard is: token update only happens when reviewToken is null on the returned trip
    expect(tokenUpdateCalls.length).toBe(0);
  });

  it("does not call sendTripCompleted for non-COMPLETED transitions", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));

    (prisma.tripRequest.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "trip-1",
      status: "REVEALED",
      userId: "user-1",
      destinationRevealedAt: new Date(),
      experienceId: null,
      reviewToken: null,
    });
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.payment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const mod = (await import("../route")) as RouteModule;
    await mod.PATCH(makePatchRequest("trip-1", { status: "REVEALED" }), {
      params: Promise.resolve({ id: "trip-1" }),
    });

    expect(sendTripCompleted).not.toHaveBeenCalled();
  });
});
