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
    experience: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

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

const completeDraftExperience = (ownerId: string) => ({
  id: "exp-1",
  ownerId,
  status: "DRAFT",
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
    (prisma.experience.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "exp-1",
      status: "PENDING_REVIEW",
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.experience.status).toBe("PENDING_REVIEW");
  });
});
