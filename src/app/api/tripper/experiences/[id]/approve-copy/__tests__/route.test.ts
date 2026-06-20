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
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/email", () => ({
  sendExperienceCopyApproved: vi.fn(),
}));

vi.mock("@/lib/experiences/changed-fields", () => ({
  overwriteOriginalWithCopy: vi.fn(),
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

const mockAdminUser = (id: string) => ({
  id,
  roles: ["ADMIN"],
});

const pendingTripperReviewExperience = (ownerId: string, extra: Record<string, unknown> = {}) => ({
  id: "exp-1",
  ownerId,
  status: "PENDING_TRIPPER_REVIEW",
  title: "Test Experience",
  reviewLockedBy: null,
  ...extra,
});

const reviewCopy = () => ({
  id: "copy-1",
  parentId: "exp-1",
  isReviewCopy: true,
  status: "DRAFT",
  title: "Modified Title",
});

function makePostRequest(id: string): Request {
  return new Request(
    `http://localhost/api/tripper/experiences/${id}/approve-copy`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("POST /api/tripper/experiences/[id]/approve-copy", () => {
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

  it("returns 403 when caller has CLIENT role only (not tripper)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("client-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "client-1",
      roles: ["CLIENT"],
    });
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 when experience is not found or not owned by the caller", async () => {
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

  it("returns 409 when original is not in PENDING_TRIPPER_REVIEW", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("tripper-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    // First findFirst = experience (wrong status), second findFirst = copy
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...pendingTripperReviewExperience("tripper-1"),
      status: "PENDING_REVIEW", // wrong status
    }).mockResolvedValueOnce(reviewCopy());
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(409);
  });

  it("returns 404 when no review copy exists", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("tripper-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(pendingTripperReviewExperience("tripper-1"))
      .mockResolvedValueOnce(null); // no copy
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 200 on happy path — overwrites original, deletes copy, status ACTIVE", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("tripper-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTripperUser("tripper-1"),
    );
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(pendingTripperReviewExperience("tripper-1"))
      .mockResolvedValueOnce(reviewCopy());
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => unknown) => {
        return cb({
          experience: {
            update: vi.fn().mockResolvedValue({ id: "exp-1", status: "ACTIVE" }),
            delete: vi.fn().mockResolvedValue({ id: "copy-1" }),
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
    expect(body.success).toBe(true);
  });
});
