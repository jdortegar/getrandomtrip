import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

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
    experience: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockSession = (userId: string) => ({
  user: { id: userId, email: "user@example.com" },
});

const mockTripperUser = (id: string) => ({ id, roles: ["TRIPPER"] });
const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });

const baseExperience = (ownerId: string, overrides: Record<string, unknown> = {}) => ({
  id: "exp-1",
  ownerId,
  status: "DRAFT",
  source: "TRIPPER",
  title: "Aventura",
  type: ["couple"],
  level: "essenza",
  teaser: "Teaser",
  description: "Descripción",
  heroImage: "https://example.com/hero.jpg",
  destinationCountry: "Argentina",
  destinationCity: "Buenos Aires",
  hotels: [],
  activities: [],
  itinerary: [],
  inclusions: [],
  exclusions: [],
  minNights: 1,
  maxNights: 7,
  minPax: 1,
  maxPax: 8,
  transport: "any",
  climate: "any",
  accommodationType: "any",
  ...overrides,
});

function makePatchRequest(body: Record<string, unknown> = {}): NextRequest {
  return new NextRequest("http://localhost/api/tripper/experiences/exp-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("PATCH /api/tripper/experiences/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (prisma.experience.update as ReturnType<typeof vi.fn>).mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({ id: "exp-1", ...data }),
    );
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("lets the owner PATCH their own experience", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTripperUser("tripper-1"));
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      baseExperience("tripper-1"),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest({ title: "Updated" }), {
      params: Promise.resolve({ id: "exp-1" }),
    });

    expect(res.status).toBe(200);
  });

  it("lets an admin PATCH a RANDOMTRIP row they don't own", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-2"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-2"));
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      baseExperience("some-other-admin", { source: "RANDOMTRIP" }),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest({ title: "Updated" }), {
      params: Promise.resolve({ id: "exp-1" }),
    });

    expect(res.status).toBe(200);
  });

  it("returns 404 when an admin tries to PATCH a TRIPPER row they don't own", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-2"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-2"));
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      baseExperience("some-tripper", { source: "TRIPPER" }),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest({ title: "Updated" }), {
      params: Promise.resolve({ id: "exp-1" }),
    });

    expect(res.status).toBe(404);
  });

  it("returns 404 when a non-admin tripper tries to PATCH a RANDOMTRIP row they don't own", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-9"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTripperUser("tripper-9"));
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      baseExperience("some-admin", { source: "RANDOMTRIP" }),
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.PATCH(makePatchRequest({ title: "Updated" }), {
      params: Promise.resolve({ id: "exp-1" }),
    });

    expect(res.status).toBe(404);
  });

  describe("revertToDraft on content change", () => {
    it("reverts a TRIPPER row to DRAFT when ACTIVE content changes", async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("tripper-1"));
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTripperUser("tripper-1"));
      (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        baseExperience("tripper-1", { status: "ACTIVE", source: "TRIPPER" }),
      );

      const mod = (await import("../route")) as RouteModule;
      const res = await mod.PATCH(makePatchRequest({ title: "Changed title" }), {
        params: Promise.resolve({ id: "exp-1" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.experience.status).toBe("DRAFT");
      expect(body.experience.isActive).toBe(false);
    });

    it("does NOT revert a RANDOMTRIP row to DRAFT when ACTIVE content changes (admin content is trusted, no review step)", async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminUser("admin-1"));
      (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        baseExperience("admin-1", { status: "ACTIVE", source: "RANDOMTRIP" }),
      );

      const mod = (await import("../route")) as RouteModule;
      const res = await mod.PATCH(makePatchRequest({ title: "Changed title" }), {
        params: Promise.resolve({ id: "exp-1" }),
      });

      expect(res.status).toBe(200);
      const updateCall = (prisma.experience.update as ReturnType<typeof vi.fn>).mock
        .calls[0]![0] as { data: Record<string, unknown> };
      expect(updateCall.data).not.toHaveProperty("status");
      expect(updateCall.data).not.toHaveProperty("isActive");
    });
  });
});
