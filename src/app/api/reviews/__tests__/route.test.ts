import { describe, it, expect, vi, beforeEach } from "vitest";

type RouteModule = typeof import("../route");

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripRequest: { findUnique: vi.fn(), update: vi.fn() },
    review: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";

function makePostRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const baseTripRequest = {
  id: "trip-1",
  userId: "user-1",
  tripperId: "tripper-1",
  reviewToken: "valid-token-abc",
  reviewSubmittedAt: null,
};

// ── Tests ──────────────────────────────────────────────────────────────────
describe("POST /api/reviews", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 404 when token does not exist (Scenario 4.3)", async () => {
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({ token: "ghost-token", rating: 3, content: "Fine" }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 409 when review already submitted (Scenario 4.2)", async () => {
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseTripRequest,
      reviewSubmittedAt: new Date(),
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({ token: "valid-token-abc", rating: 4, content: "Great" }),
    );
    expect(res.status).toBe(409);
  });

  it("returns 400 when rating is below range (Scenario 4.4)", async () => {
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(baseTripRequest);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({ token: "valid-token-abc", rating: 0, content: "Bad" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when rating is above range (Scenario 4.5)", async () => {
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(baseTripRequest);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({ token: "valid-token-abc", rating: 6, content: "Superb" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when rating is not an integer (Scenario 4.6)", async () => {
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(baseTripRequest);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({ token: "valid-token-abc", rating: 3.5, content: "Ok" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when content is empty (Scenario 4.7)", async () => {
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(baseTripRequest);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({ token: "valid-token-abc", rating: 5, content: "" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 and creates review with correct data (Scenario 4.1)", async () => {
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(baseTripRequest);
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma),
    );
    (prisma.review.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "review-1" });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest({
        token: "valid-token-abc",
        rating: 4,
        content: "Great trip!",
        title: "Loved it",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("creates review with isApproved=false and isPublic=false (Scenario 4.1)", async () => {
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(baseTripRequest);
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma),
    );
    (prisma.review.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "review-1" });

    const mod = (await import("../route")) as RouteModule;
    await mod.POST(
      makePostRequest({ token: "valid-token-abc", rating: 4, content: "Great!" }),
    );

    expect(prisma.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isApproved: false,
          isPublic: false,
          rating: 4,
          content: "Great!",
        }),
      }),
    );
  });

  it("sets tripperId from TripRequest on the Review (Scenario 4.8)", async () => {
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseTripRequest,
      tripperId: "tripper-uuid",
    });
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma),
    );
    (prisma.review.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "review-1" });

    const mod = (await import("../route")) as RouteModule;
    await mod.POST(
      makePostRequest({ token: "valid-token-abc", rating: 5, content: "Amazing!" }),
    );

    expect(prisma.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tripperId: "tripper-uuid" }),
      }),
    );
  });

  it("sets tripperId=null for RandomTrip (Scenario 4.9)", async () => {
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseTripRequest,
      tripperId: null,
    });
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma),
    );
    (prisma.review.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "review-1" });

    const mod = (await import("../route")) as RouteModule;
    await mod.POST(
      makePostRequest({ token: "valid-token-abc", rating: 3, content: "Nice" }),
    );

    expect(prisma.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tripperId: null }),
      }),
    );
  });

  it("works without auth header (Scenario 4.10 — public endpoint)", async () => {
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(baseTripRequest);
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma),
    );
    (prisma.review.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "review-1" });

    const req = new Request("http://localhost/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // No Authorization header
      body: JSON.stringify({ token: "valid-token-abc", rating: 4, content: "Public!" }),
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(req);
    expect(res.status).toBe(200);
  });
});
