import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { overwriteOriginalWithCopy as OverwriteFn } from "@/lib/experiences/changed-fields";

type RouteModule = typeof import("../route");
type OverwriteModule = { overwriteOriginalWithCopy: typeof OverwriteFn };

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
    experience: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/experiences/changed-fields", () => ({
  overwriteOriginalWithCopy: vi.fn(),
}));

// ── Helpers ────────────────────────────────────────────────────────────────
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockSession = (userId: string) => ({
  user: { id: userId, email: "admin@example.com" },
});

const mockAdminUser = (id: string) => ({
  id,
  roles: ["ADMIN"],
});

const mockClientUser = (id: string) => ({
  id,
  roles: ["CLIENT"],
});

const pendingExperience = () => ({
  id: "exp-1",
  status: "PENDING_REVIEW",
  type: ["couple", "group"],
  level: "essenza",
  title: "Aventura Mágica",
  teaser: "Una experiencia única",
  description: "Descripción",
  heroImage: "https://example.com/hero.jpg",
  destinationCountry: "Argentina",
  destinationCity: "Buenos Aires",
  minPax: 1,
  maxPax: 8,
  pricingByType: null,
  reviewNote: "Some previous note",
});

function makePostRequest(id: string, body: Record<string, unknown>): Request {
  return new Request(`http://localhost/api/admin/experiences/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("POST /api/admin/experiences/[id]/approve", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns 401 when there is no active session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest("exp-1", { pricingByType: { couple: 200, group: 150 } }),
      { params: Promise.resolve({ id: "exp-1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when the caller is not an admin", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("client-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockClientUser("client-1"),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest("exp-1", { pricingByType: { couple: 200, group: 150 } }),
      { params: Promise.resolve({ id: "exp-1" }) },
    );
    expect(res.status).toBe(403);
  });

  it("returns 409 when experience is not in PENDING_REVIEW", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...pendingExperience(),
      status: "ACTIVE",
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest("exp-1", { pricingByType: { couple: 200, group: 150 } }),
      { params: Promise.resolve({ id: "exp-1" }) },
    );
    expect(res.status).toBe(409);
  });

  it("returns 422 when pricingByType keys do not match experience type[]", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      pendingExperience(),
    );
    const mod = (await import("../route")) as RouteModule;
    // type is ["couple", "group"] but pricingByType only has "couple" → key mismatch
    const res = await mod.POST(
      makePostRequest("exp-1", { pricingByType: { couple: 200 } }),
      { params: Promise.resolve({ id: "exp-1" }) },
    );
    expect(res.status).toBe(422);
  });

  it("returns 422 when a pricing value is zero or negative", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      pendingExperience(),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest("exp-1", { pricingByType: { couple: 0, group: 150 } }),
      { params: Promise.resolve({ id: "exp-1" }) },
    );
    expect(res.status).toBe(422);
  });

  it("returns 200, sets ACTIVE, saves pricingByType, clears reviewNote on valid approval", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      pendingExperience(),
    );
    // No review copy exists — direct approve path
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.experience.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "exp-1",
      status: "ACTIVE",
      pricingByType: { couple: 250, group: 180 },
      reviewNote: null,
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest("exp-1", { pricingByType: { couple: 250, group: 180 } }),
      { params: Promise.resolve({ id: "exp-1" }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.experience.status).toBe("ACTIVE");
    expect(body.experience.reviewNote).toBeNull();
    expect(body.experience.pricingByType).toEqual({ couple: 250, group: 180 });

    // Verify the update was called with correct data
    expect(prisma.experience.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "ACTIVE",
          isActive: true,
          reviewNote: null,
        }),
      }),
    );
  });

  it("returns 200 via copy-overwrite path when a non-INACTIVE copy exists", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      pendingExperience(),
    );
    // A review copy exists — triggers the copy-overwrite branch
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "copy-1",
    });

    const overwrittenExperience = {
      id: "exp-1",
      status: "ACTIVE",
      isActive: true,
      pricingByType: { couple: 300, group: 200 },
      reviewNote: null,
      ownerId: null,
    };

    const mockTx = {
      experience: {
        update: vi.fn().mockResolvedValue(overwrittenExperience),
        delete: vi.fn().mockResolvedValue({}),
      },
    };

    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
    );

    const changedFieldsMod = (await import(
      "@/lib/experiences/changed-fields"
    )) as OverwriteModule;
    (changedFieldsMod.overwriteOriginalWithCopy as ReturnType<typeof vi.fn>).mockResolvedValue(
      overwrittenExperience,
    );

    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(
      makePostRequest("exp-1", { pricingByType: { couple: 300, group: 200 } }),
      { params: Promise.resolve({ id: "exp-1" }) },
    );

    expect(res.status).toBe(200);

    // overwriteOriginalWithCopy must have been called with the right IDs
    expect(changedFieldsMod.overwriteOriginalWithCopy).toHaveBeenCalledWith(
      mockTx,
      "exp-1",
      "copy-1",
    );

    // Copy must be deleted inside the transaction
    expect(mockTx.experience.delete).toHaveBeenCalledWith({
      where: { id: "copy-1" },
    });

    // pricingByType must be applied on top after overwrite
    expect(mockTx.experience.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pricingByType: { couple: 300, group: 200 },
        }),
      }),
    );
  });
});
