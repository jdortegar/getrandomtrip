import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/db/tripRequest", () => ({
  revertExpiredPendingPaymentsForUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    tripRequest: { findMany: vi.fn(), count: vi.fn() },
    payment: { findUnique: vi.fn() },
  },
}));

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { revertExpiredPendingPaymentsForUser } from "@/lib/db/tripRequest";

const mockUser = { id: "user-1", email: "test@example.com" };

function makeRequest(url = "http://localhost/api/trips") {
  return new NextRequest(url, { method: "GET" });
}

describe("GET /api/trips", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: mockUser.email },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockUser,
    );
    (
      revertExpiredPendingPaymentsForUser as ReturnType<typeof vi.fn>
    ).mockResolvedValue(0);
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      [],
    );
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
  });

  it("invokes the shared expiry-revert helper before querying trips", async () => {
    const { GET } = await import("../route");

    await GET(makeRequest());

    expect(revertExpiredPendingPaymentsForUser).toHaveBeenCalledWith(
      "user-1",
    );
    expect(prisma.tripRequest.findMany).toHaveBeenCalledTimes(1);

    const revertOrder = (
      revertExpiredPendingPaymentsForUser as ReturnType<typeof vi.fn>
    ).mock.invocationCallOrder[0];
    const findManyOrder = (
      prisma.tripRequest.findMany as ReturnType<typeof vi.fn>
    ).mock.invocationCallOrder[0];
    expect(revertOrder).toBeLessThan(findManyOrder);
  });

  it("returns 401 when session is missing", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const { GET } = await import("../route");

    const res = await GET(makeRequest());

    expect(res.status).toBe(401);
    expect(revertExpiredPendingPaymentsForUser).not.toHaveBeenCalled();
  });
});

describe("POST /api/trips — removed", () => {
  it("no longer exports a POST handler", async () => {
    const trips = await import("../route");

    expect(trips).not.toHaveProperty("POST");
    expect(trips.GET).toBeTypeOf("function");
  });
});
