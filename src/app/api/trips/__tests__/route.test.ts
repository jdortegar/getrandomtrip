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

    expect(revertExpiredPendingPaymentsForUser).toHaveBeenCalledWith("user-1");
    expect(prisma.tripRequest.findMany).toHaveBeenCalledTimes(1);

    const revertOrder = (
      revertExpiredPendingPaymentsForUser as ReturnType<typeof vi.fn>
    ).mock.invocationCallOrder[0];
    const findManyOrder = (
      prisma.tripRequest.findMany as ReturnType<typeof vi.fn>
    ).mock.invocationCallOrder[0];
    expect(revertOrder).toBeLessThan(findManyOrder);
  });

  it.each(["user-1", "other-buyer"])(
    "hides CONFIRMED destination from owner=%s but retains revealed content",
    async (userId) => {
      vi.mocked(prisma.tripRequest.findMany).mockResolvedValue([
        {
          id: "hidden",
          userId,
          type: "couple",
          level: "essenza",
          status: "CONFIRMED",
          actualDestination: "Secret city",
        },
        {
          id: "visible",
          userId,
          type: "couple",
          level: "essenza",
          status: "REVEALED",
          actualDestination: "Visible city",
        },
      ] as never);
      const { GET } = await import("../route");
      const res = await GET(makeRequest());
      expect(res.status).toBe(200);
      const { trips } = await res.json();
      expect(trips[0].actualDestination).toBeNull();
      expect(trips[1].actualDestination).toBe("Visible city");
    },
  );

  it("returns 401 when session is missing", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const { GET } = await import("../route");

    const res = await GET(makeRequest());

    expect(res.status).toBe(401);
    expect(revertExpiredPendingPaymentsForUser).not.toHaveBeenCalled();
    expect(prisma.tripRequest.findMany).not.toHaveBeenCalled();
  });

  it("combines filters before pagination and count without replacing owner/companion scope", async () => {
    const { GET } = await import("../route");
    const response = await GET(
      makeRequest(
        "http://localhost/api/trips?page=2&limit=5&status=CONFIRMED,REVEALED&level=xsed&type=xsed&search=%20Pilar%20",
      ),
    );
    expect(response.status).toBe(200);
    const args = vi.mocked(prisma.tripRequest.findMany).mock.calls[0][0]!;
    expect(args).toMatchObject({
      skip: 5,
      take: 5,
      where: {
        OR: [
          { userId: mockUser.id },
          { travelers: { some: { userId: mockUser.id } } },
        ],
        status: { in: ["CONFIRMED", "REVEALED"] },
        type: "xsed",
        AND: [
          { OR: [{ level: "xsed" }, { type: "xsed" }] },
          {
            OR: [
              { originCity: { contains: "Pilar", mode: "insensitive" } },
              { originCountry: { contains: "Pilar", mode: "insensitive" } },
              { id: { contains: "Pilar", mode: "insensitive" } },
            ],
          },
        ],
      },
    });
    expect(vi.mocked(prisma.tripRequest.count).mock.calls[0][0]?.where).toBe(
      args.where,
    );
  });

  it("preserves CANCELLED as a valid status for both results and count", async () => {
    const { GET } = await import("../route");
    await GET(makeRequest("http://localhost/api/trips?status=CANCELLED"));
    const where = vi.mocked(prisma.tripRequest.findMany).mock.calls[0][0]!
      .where!;
    expect(where.status).toEqual({ in: ["CANCELLED"] });
    expect(vi.mocked(prisma.tripRequest.count).mock.calls[0][0]?.where).toBe(
      where,
    );
  });

  it.each([
    { type: "xsed", level: "solo" },
    { type: "xsed", level: "couple" },
    { type: "xsed", level: "family" },
    { type: "xsed", level: "group" },
    { type: "xsed", level: "xsed" },
    { type: "couple", level: "xsed" },
  ])(
    "matches XSED display classification for stored %j with type/search/count",
    async (classification) => {
      const trip = {
        id: "xsed-booking",
        userId: mockUser.id,
        ...classification,
        originCity: "Pilar",
        status: "CONFIRMED",
        actualDestination: "Secret city",
      };
      vi.mocked(prisma.tripRequest.findMany).mockResolvedValue([trip] as never);
      vi.mocked(prisma.tripRequest.count).mockResolvedValue(1);
      const { GET } = await import("../route");
      const response = await GET(
        makeRequest(
          `http://localhost/api/trips?level=xsed&type=${classification.type}&search=Pilar`,
        ),
      );
      const where = vi.mocked(prisma.tripRequest.findMany).mock.calls[0][0]!
        .where!;
      expect(where.level).toBeUndefined();
      expect(where.type).toBe(classification.type);
      expect(where.OR).toEqual([
        { userId: mockUser.id },
        { travelers: { some: { userId: mockUser.id } } },
      ]);
      expect(where.AND).toEqual([
        { OR: [{ level: "xsed" }, { type: "xsed" }] },
        {
          OR: [
            { originCity: { contains: "Pilar", mode: "insensitive" } },
            { originCountry: { contains: "Pilar", mode: "insensitive" } },
            { id: { contains: "Pilar", mode: "insensitive" } },
          ],
        },
      ]);
      const expression = (
        where.AND as Array<{ OR: Array<{ level?: string; type?: string }> }>
      )[0];
      expect(
        expression.OR.some(
          (clause) => clause.level === trip.level || clause.type === trip.type,
        ),
      ).toBe(true);
      expect(vi.mocked(prisma.tripRequest.count).mock.calls[0][0]?.where).toBe(
        where,
      );
      const body = await response.json();
      expect(body.total).toBe(1);
      expect(body.trips[0].id).toBe(trip.id);
      expect(body.trips[0].actualDestination).toBeNull();
    },
  );

  it("does not classify an XSED-type trip as another experience", async () => {
    const { GET } = await import("../route");
    await GET(
      makeRequest("http://localhost/api/trips?level=essenza&type=couple"),
    );
    const where = vi.mocked(prisma.tripRequest.findMany).mock.calls[0][0]!
      .where!;
    expect(where.level).toBe("essenza");
    expect(where.type).toBe("couple");
    expect(where.AND).toEqual([{ NOT: { type: "xsed" } }]);
    expect(vi.mocked(prisma.tripRequest.count).mock.calls[0][0]?.where).toBe(
      where,
    );
  });

  it("never searches hidden destination, package or user fields", async () => {
    const { GET } = await import("../route");
    await GET(makeRequest("http://localhost/api/trips?search=Secret%20city"));
    const where = vi.mocked(prisma.tripRequest.findMany).mock.calls[0][0]!
      .where!;
    expect(where.AND).toEqual([
      {
        OR: [
          { originCity: { contains: "Secret city", mode: "insensitive" } },
          { originCountry: { contains: "Secret city", mode: "insensitive" } },
          { id: { contains: "Secret city", mode: "insensitive" } },
        ],
      },
    ]);
    expect(JSON.stringify(where)).not.toMatch(
      /actualDestination|package|email|name/,
    );
    expect(vi.mocked(prisma.tripRequest.count).mock.calls[0][0]?.where).toBe(
      where,
    );
  });

  it("ignores invalid experience/type values and whitespace-only search", async () => {
    const { GET } = await import("../route");
    await GET(
      makeRequest(
        "http://localhost/api/trips?level=invalid&type=invalid&search=%20%20",
      ),
    );
    expect(
      vi.mocked(prisma.tripRequest.findMany).mock.calls[0][0]?.where,
    ).toEqual({
      OR: [
        { userId: mockUser.id },
        { travelers: { some: { userId: mockUser.id } } },
      ],
    });
  });
});

describe("POST /api/trips — removed", () => {
  it("no longer exports a POST handler", async () => {
    const trips = await import("../route");

    expect(trips).not.toHaveProperty("POST");
    expect(trips.GET).toBeTypeOf("function");
  });
});
