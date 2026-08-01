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
    user: { findUnique: vi.fn() },
    tripRequest: { findMany: vi.fn() },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { tripAccessWhere } from "@/lib/travelers/travelerAccess";

function makeGetRequest() {
  return new Request("http://localhost/api/trip-requests", {
    method: "GET",
  }) as unknown as import("next/server").NextRequest;
}

const mockUser = { id: "user-1", email: "test@example.com" };

describe("GET /api/trip-requests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when session is missing", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const mod = await import("../route");
    const res = await mod.GET(makeGetRequest());

    expect(res.status).toBe(401);
  });

  it("queries via the shared tripAccessWhere predicate (buyer OR companion), not a buyer-only where", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: mockUser.email },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockUser,
    );
    (
      prisma.tripRequest.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);

    const mod = await import("../route");
    await mod.GET(makeGetRequest());

    const args = (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(args.where).toEqual(tripAccessWhere(mockUser.id));
  });

  it("tags each returned trip with role 'buyer' or 'companion'", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: mockUser.email },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockUser,
    );
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      [
        { id: "trip-owned", userId: "user-1" },
        { id: "trip-companion", userId: "other-buyer" },
      ],
    );

    const mod = await import("../route");
    const res = await mod.GET(makeGetRequest());
    const body = await res.json();

    expect(body.tripRequests).toEqual([
      { id: "trip-owned", userId: "user-1", role: "buyer" },
      { id: "trip-companion", userId: "other-buyer", role: "companion" },
    ]);
  });
});
