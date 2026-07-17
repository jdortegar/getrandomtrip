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
    experience: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/email", () => ({
  sendExperienceSubmitted: vi.fn(),
}));

// ── Helpers ────────────────────────────────────────────────────────────────
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { sendExperienceSubmitted } from "@/lib/email";

const mockSession = (userId: string) => ({
  user: { id: userId, email: "tripper@example.com" },
});

const mockTripperUser = (id: string) => ({
  id,
  roles: ["TRIPPER"],
});

const mockClientUser = (id: string) => ({
  id,
  roles: ["CLIENT"],
});

const mockAdminUser = (id: string) => ({
  id,
  roles: ["ADMIN"],
});

const completeDraftExperience = (ownerId: string, overrides: Record<string, unknown> = {}) => ({
  id: "exp-1",
  ownerId,
  status: "DRAFT",
  source: "TRIPPER",
  title: "Aventura Mágica",
  type: ["couple"],
  level: "essenza",
  teaser: "Una experiencia única",
  description: "Descripción completa",
  heroImage: "https://example.com/hero.jpg",
  destinationCountry: "Argentina",
  destinationCity: "Buenos Aires",
  activities: [{ name: "Kayak", durationRhythm: "morning", description: "", risks: "" }],
  reviewNote: null,
  ...overrides,
});

const incompleteDraftExperience = (ownerId: string) => ({
  id: "exp-2",
  ownerId,
  status: "DRAFT",
  title: "Aventura Mágica",
  type: ["couple"],
  level: "essenza",
  teaser: "Una experiencia única",
  description: "Descripción completa",
  heroImage: "", // missing
  destinationCountry: "Argentina",
  destinationCity: "Buenos Aires",
  activities: [{ name: "Kayak", durationRhythm: "morning", description: "", risks: "" }],
  reviewNote: null,
});

function makePostRequest(id: string): Request {
  return new Request(`http://localhost/api/tripper/experiences/${id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("POST /api/tripper/experiences/[id]/submit", () => {
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

  it("returns 403 when the caller is not a tripper (CLIENT role)", async () => {
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

  it("returns 404 when the experience is not owned by the caller", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("tripper-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 409 when experience is not in DRAFT status", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("tripper-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...completeDraftExperience("tripper-1"),
      status: "PENDING_REVIEW",
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(409);
  });

  it("returns 422 with missing[] when required fields are incomplete", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("tripper-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      incompleteDraftExperience("tripper-1"),
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-2"), {
      params: Promise.resolve({ id: "exp-2" }),
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.missing).toContain("heroImage");
  });

  it("returns 200 and sets status to PENDING_REVIEW on valid DRAFT", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("tripper-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      completeDraftExperience("tripper-1"),
    );
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => unknown) => {
        return cb({
          experience: {
            findFirst: vi.fn().mockResolvedValue(null), // no INACTIVE copy
            update: vi.fn().mockResolvedValue({ id: "exp-1", status: "PENDING_REVIEW" }),
            delete: vi.fn(),
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
    expect(body.experience.status).toBe("PENDING_REVIEW");
  });

  it("deletes INACTIVE copy when resubmitting after a tripper rejection", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("tripper-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      completeDraftExperience("tripper-1"),
    );
    const mockDelete = vi.fn().mockResolvedValue({ id: "inactive-copy-1" });
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => unknown) => {
        return cb({
          experience: {
            findFirst: vi.fn().mockResolvedValue({ id: "inactive-copy-1" }), // INACTIVE copy exists
            update: vi.fn().mockResolvedValue({ id: "exp-1", status: "PENDING_REVIEW" }),
            delete: mockDelete,
          },
        });
      },
    );
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(200);
    // Verify delete was called for the INACTIVE copy
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "inactive-copy-1" } });
  });

  // ── Source-aware finalize (Phase 3: admin-owned-experiences) ─────────────
  describe("source-aware finalize", () => {
    function mockTransactionPassthrough() {
      (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
        async (cb: (tx: unknown) => unknown) => {
          return cb({
            experience: {
              findFirst: vi.fn().mockResolvedValue(null), // no INACTIVE copy
              update: vi.fn().mockImplementation(
                async ({
                  data,
                }: {
                  data: Record<string, unknown>;
                }) => ({ id: "exp-1", status: data.status, pricingByType: data.pricingByType }),
              ),
              delete: vi.fn(),
            },
          });
        },
      );
    }

    it("RANDOMTRIP experience finalizes straight to ACTIVE, skipping PENDING_REVIEW (Scenario: Admin/RandomTrip creation skips PENDING_REVIEW)", async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSession("admin-1"),
      );
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTripperUser("admin-1"),
      );
      (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        completeDraftExperience("admin-1", { source: "RANDOMTRIP" }),
      );
      mockTransactionPassthrough();

      const mod = (await import("../route")) as RouteModule;
      const res = await mod.POST(makePostRequest("exp-1"), {
        params: Promise.resolve({ id: "exp-1" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.experience.status).toBe("ACTIVE");
    });

    it("does not call sendExperienceSubmitted for a RANDOMTRIP finalize", async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSession("admin-1"),
      );
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTripperUser("admin-1"),
      );
      (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        completeDraftExperience("admin-1", { source: "RANDOMTRIP" }),
      );
      mockTransactionPassthrough();

      const mod = (await import("../route")) as RouteModule;
      await mod.POST(makePostRequest("exp-1"), {
        params: Promise.resolve({ id: "exp-1" }),
      });

      expect(sendExperienceSubmitted).not.toHaveBeenCalled();
    });

    it("TRIPPER experience finalizes to PENDING_REVIEW and calls sendExperienceSubmitted (Scenario: Tripper-created rows cannot reach ACTIVE directly)", async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSession("tripper-1"),
      );
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTripperUser("tripper-1"),
      );
      (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        completeDraftExperience("tripper-1", { source: "TRIPPER" }),
      );
      mockTransactionPassthrough();

      const mod = (await import("../route")) as RouteModule;
      const res = await mod.POST(makePostRequest("exp-1"), {
        params: Promise.resolve({ id: "exp-1" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.experience.status).toBe("PENDING_REVIEW");
      expect(sendExperienceSubmitted).toHaveBeenCalledWith("exp-1", "tripper-1");
    });

    it("derives pricingByType for RANDOMTRIP from getBasePricePerPerson per non-XSED type, no commission add-on", async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSession("admin-1"),
      );
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTripperUser("admin-1"),
      );
      (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        completeDraftExperience("admin-1", {
          source: "RANDOMTRIP",
          type: ["couple"],
          level: "essenza",
        }),
      );
      mockTransactionPassthrough();

      const mod = (await import("../route")) as RouteModule;
      const res = await mod.POST(makePostRequest("exp-1"), {
        params: Promise.resolve({ id: "exp-1" }),
      });

      const body = await res.json();
      // couple/essenza base price is 350 (PRICE_BY_TYPE_AND_LEVEL) — no commission added.
      expect(body.experience.pricingByType).toEqual({ couple: 350 });
    });

    it("excludes the XSED type from derived pricingByType for a RANDOMTRIP row that mixes types", async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSession("admin-1"),
      );
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTripperUser("admin-1"),
      );
      (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        completeDraftExperience("admin-1", {
          source: "RANDOMTRIP",
          type: ["couple", "XSED"],
          level: "essenza",
        }),
      );
      mockTransactionPassthrough();

      const mod = (await import("../route")) as RouteModule;
      const res = await mod.POST(makePostRequest("exp-1"), {
        params: Promise.resolve({ id: "exp-1" }),
      });

      const body = await res.json();
      expect(body.experience.pricingByType).toEqual({ couple: 350 });
    });

    it("returns 422 'unpriceable' when a RANDOMTRIP row's only type is XSED (nothing left to price after filtering)", async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSession("admin-1"),
      );
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTripperUser("admin-1"),
      );
      (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        completeDraftExperience("admin-1", {
          source: "RANDOMTRIP",
          type: ["XSED"],
          level: "essenza",
        }),
      );

      const mod = (await import("../route")) as RouteModule;
      const res = await mod.POST(makePostRequest("exp-1"), {
        params: Promise.resolve({ id: "exp-1" }),
      });

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toBe("unpriceable");
    });

    it("returns 422 'unpriceable' when a RANDOMTRIP row's type/level combo prices at 0 (unrecognized type)", async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSession("admin-1"),
      );
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTripperUser("admin-1"),
      );
      (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        completeDraftExperience("admin-1", {
          source: "RANDOMTRIP",
          type: ["not-a-real-traveler-type"],
          level: "essenza",
        }),
      );

      const mod = (await import("../route")) as RouteModule;
      const res = await mod.POST(makePostRequest("exp-1"), {
        params: Promise.resolve({ id: "exp-1" }),
      });

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toBe("unpriceable");
    });

    it("does not apply the unpriceable guard to TRIPPER rows (pricingByType is admin-set later during review, not derived here)", async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSession("tripper-1"),
      );
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTripperUser("tripper-1"),
      );
      (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        completeDraftExperience("tripper-1", { source: "TRIPPER", type: ["XSED"] }),
      );
      mockTransactionPassthrough();

      const mod = (await import("../route")) as RouteModule;
      const res = await mod.POST(makePostRequest("exp-1"), {
        params: Promise.resolve({ id: "exp-1" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.experience.status).toBe("PENDING_REVIEW");
    });
  });

  // ── Admin bypass for non-owned RANDOMTRIP rows (Phase: admin-owned-experiences edit page) ──
  describe("admin bypass authorization", () => {
    it("lets an admin (no tripper role) finalize a RANDOMTRIP row owned by a different user", async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSession("admin-2"),
      );
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockAdminUser("admin-2"),
      );
      (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        completeDraftExperience("some-other-admin", { source: "RANDOMTRIP" }),
      );
      (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
        async (cb: (tx: unknown) => unknown) =>
          cb({
            experience: {
              findFirst: vi.fn().mockResolvedValue(null),
              update: vi.fn().mockResolvedValue({ id: "exp-1", status: "ACTIVE", pricingByType: {} }),
              delete: vi.fn(),
            },
          }),
      );

      const mod = (await import("../route")) as RouteModule;
      const res = await mod.POST(makePostRequest("exp-1"), {
        params: Promise.resolve({ id: "exp-1" }),
      });

      expect(res.status).toBe(200);
    });

    it("returns 404 when an admin (no tripper role) tries to finalize a TRIPPER row they don't own", async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSession("admin-2"),
      );
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockAdminUser("admin-2"),
      );
      (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        completeDraftExperience("some-tripper", { source: "TRIPPER" }),
      );

      const mod = (await import("../route")) as RouteModule;
      const res = await mod.POST(makePostRequest("exp-1"), {
        params: Promise.resolve({ id: "exp-1" }),
      });

      expect(res.status).toBe(404);
    });

    it("returns 404 when a non-admin tripper tries to finalize a RANDOMTRIP row they don't own", async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSession("tripper-9"),
      );
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTripperUser("tripper-9"),
      );
      (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        completeDraftExperience("some-admin", { source: "RANDOMTRIP" }),
      );

      const mod = (await import("../route")) as RouteModule;
      const res = await mod.POST(makePostRequest("exp-1"), {
        params: Promise.resolve({ id: "exp-1" }),
      });

      expect(res.status).toBe(404);
    });
  });
});
