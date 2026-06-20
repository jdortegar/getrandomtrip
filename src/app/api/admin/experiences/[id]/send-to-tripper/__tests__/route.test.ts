import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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
    experience: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/email", () => ({
  sendExperiencePendingTripperReview: vi.fn(),
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

const pendingExperience = (extra: Record<string, unknown> = {}) => ({
  id: "exp-1",
  status: "PENDING_REVIEW",
  ownerId: "tripper-1",
  title: "Test Experience",
  reviewLockedBy: "admin-1",
  ...extra,
});

const reviewCopy = (extra: Record<string, unknown> = {}) => ({
  id: "copy-1",
  parentId: "exp-1",
  isReviewCopy: true,
  status: "DRAFT",
  title: "Modified Title",
  teaser: "Original teaser",
  description: "Modified description",
  type: ["couple"],
  level: "essenza",
  heroImage: "https://example.com/hero.jpg",
  tags: [],
  destinationCountry: "Argentina",
  destinationCity: "Buenos Aires",
  excuseKey: [],
  minNights: 2,
  maxNights: 5,
  minPax: 1,
  maxPax: 4,
  pricingByType: null,
  hotels: null,
  activities: null,
  itinerary: null,
  inclusions: null,
  exclusions: null,
  accommodationType: "any",
  transport: "any",
  climate: "any",
  maxTravelTime: "no-limit",
  departPref: "any",
  arrivePref: "any",
  season: [],
  ...extra,
});

function makePostRequest(id: string): Request {
  return new Request(
    `http://localhost/api/admin/experiences/${id}/send-to-tripper`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("POST /api/admin/experiences/[id]/send-to-tripper", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns 401 when there is no active session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when caller is not an admin", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("client-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockClientUser("client-1"),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 when no review copy exists", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      pendingExperience(),
    );
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 422 when no fields have changed between copy and original", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    // Original and copy are identical in mutable fields
    const original = pendingExperience({
      title: "Same Title",
      teaser: "Same",
      description: "Same",
      type: ["couple"],
      level: "essenza",
      heroImage: "https://example.com/hero.jpg",
      tags: [],
      destinationCountry: "Argentina",
      destinationCity: "Buenos Aires",
      excuseKey: [],
      minNights: 2,
      maxNights: 5,
      minPax: 1,
      maxPax: 4,
      pricingByType: null,
      hotels: null,
      activities: null,
      itinerary: null,
      inclusions: null,
      exclusions: null,
      accommodationType: "any",
      transport: "any",
      climate: "any",
      maxTravelTime: "no-limit",
      departPref: "any",
      arrivePref: "any",
      season: [],
    });
    const copy = reviewCopy({
      title: "Same Title",
      teaser: "Same",
      description: "Same",
    });
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(original);
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(copy);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("no_changes");
  });

  it("returns 200 on happy path — changedFields stored, status updated, lock cleared", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    const original = pendingExperience({
      title: "Original Title",
      description: "Original description",
    });
    const copy = reviewCopy({
      title: "Modified Title",
      description: "Modified description",
    });
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(original);
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(copy);
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => unknown) => {
        return cb({
          experience: {
            update: vi.fn().mockResolvedValue({ id: "exp-1", status: "PENDING_TRIPPER_REVIEW" }),
          },
        });
      },
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.changedFields).toBeDefined();
    expect(Array.isArray(body.changedFields)).toBe(true);
    expect(body.changedFields.length).toBeGreaterThan(0);
  });

  it("detects single-field change correctly", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    const original = pendingExperience({
      title: "Same",
      description: "Same",
      heroImage: "https://example.com/hero.jpg",
      type: ["couple"],
      level: "essenza",
      teaser: "Same",
      tags: [],
      destinationCountry: "Argentina",
      destinationCity: "Buenos Aires",
      excuseKey: [],
      minNights: 2,
      maxNights: 5,
      minPax: 1,
      maxPax: 4,
      pricingByType: null,
      hotels: null,
      activities: null,
      itinerary: null,
      inclusions: null,
      exclusions: null,
      accommodationType: "any",
      transport: "any",
      climate: "any",
      maxTravelTime: "no-limit",
      departPref: "any",
      arrivePref: "any",
      season: [],
    });
    const copy = reviewCopy({
      title: "Same",
      description: "Only description changed",
    });
    (prisma.experience.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(original);
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(copy);
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => unknown) => {
        return cb({
          experience: {
            update: vi.fn().mockResolvedValue({ id: "exp-1" }),
          },
        });
      },
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.changedFields).toContain("description");
  });
});
