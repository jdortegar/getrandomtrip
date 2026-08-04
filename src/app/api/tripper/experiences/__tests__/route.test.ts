import { describe, it, expect, vi, beforeEach } from "vitest";

type RouteModule = typeof import("../route");

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/db/tripper-queries", () => ({
  getTripperExperiences: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    experience: { create: vi.fn() },
  },
}));

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getTripperExperiences } from "@/lib/db/tripper-queries";

const mockSession = (userId: string) => ({
  user: { id: userId, email: "user@example.com" },
});

const mockTripperUser = (id: string) => ({ id, roles: ["TRIPPER"] });
const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });

function baseDraftBody(overrides: Record<string, unknown> = {}) {
  return {
    title: "Aventura Urbana",
    type: ["couple"],
    level: "essenza",
    teaser: "Teaser",
    description: "Description",
    heroImage: "https://example.com/hero.jpg",
    tags: [],
    destinationCountry: "Argentina",
    destinationCity: "Buenos Aires",
    excuseKey: [],
    minNights: 2,
    maxNights: 4,
    minPax: 1,
    maxPax: 4,
    accommodations: [],
    activities: [],
    itinerary: [],
    inclusions: [],
    exclusions: [],
    accommodationType: "any",
    transport: "any",
    climate: "any",
    maxTravelTime: "no-limit",
    departPref: "any",
    arrivePref: "any",
    season: [],
    ...overrides,
  };
}

function makePostRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/tripper/experiences", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/tripper/experiences — pagination and filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getTripperExperiences as ReturnType<typeof vi.fn>).mockResolvedValue({
      experiences: [],
      total: 0,
    });
  });

  it("defaults to page 1, limit 20, no filters", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("tripper-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(
      new NextRequest("http://localhost/api/tripper/experiences"),
    );
    const body = await res.json();

    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
    expect(getTripperExperiences).toHaveBeenCalledWith(
      "tripper-1",
      { page: 1, limit: 20 },
      { status: undefined, level: undefined, type: undefined, search: undefined },
    );
  });

  it("forwards page/limit and search/status/level/type filters", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("tripper-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (getTripperExperiences as ReturnType<typeof vi.fn>).mockResolvedValue({
      experiences: [],
      total: 42,
    });

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.GET(
      new NextRequest(
        "http://localhost/api/tripper/experiences?page=2&limit=10&status=ACTIVE&level=essenza&type=solo&search=patagonia",
      ),
    );
    const body = await res.json();

    expect(body.total).toBe(42);
    expect(getTripperExperiences).toHaveBeenCalledWith(
      "tripper-1",
      { page: 2, limit: 10 },
      { status: "ACTIVE", level: "essenza", type: "solo", search: "patagonia" },
    );
  });
});

describe("POST /api/tripper/experiences — role-aware source", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.experience.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "exp-1",
    });
  });

  it("persists source: TRIPPER and status: DRAFT for a tripper caller (Scenario: Source derived from tripper caller)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("tripper-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makePostRequest(baseDraftBody()) as any,
    );

    expect(res.status).toBe(201);
    expect(prisma.experience.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: "TRIPPER",
          status: "DRAFT",
        }),
      }),
    );
  });

  it("persists source: RANDOMTRIP and status: DRAFT for an admin caller (Scenario: Source derived from admin caller)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makePostRequest(baseDraftBody()) as any,
    );

    expect(res.status).toBe(201);
    expect(prisma.experience.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: "RANDOMTRIP",
          status: "DRAFT",
        }),
      }),
    );
  });

  it("ignores a client-sent source field for a tripper caller (Scenario: Client-sent source is ignored)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("tripper-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    await mod.POST(
      makePostRequest(
        baseDraftBody({ source: "RANDOMTRIP" }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any,
    );

    expect(prisma.experience.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ source: "TRIPPER" }),
      }),
    );
  });
});
