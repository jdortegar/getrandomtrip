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
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/email", () => ({
  sendExperienceCopyRejected: vi.fn(),
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

const pendingTripperReviewExperience = (ownerId: string, extra: Record<string, unknown> = {}) => ({
  id: "exp-1",
  ownerId,
  status: "PENDING_TRIPPER_REVIEW",
  title: "Test Experience",
  ...extra,
});

const reviewCopy = () => ({
  id: "copy-1",
  parentId: "exp-1",
  isReviewCopy: true,
  status: "DRAFT",
});

function makePostRequest(id: string): Request {
  return new Request(
    `http://localhost/api/tripper/experiences/${id}/reject-copy`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("POST /api/tripper/experiences/[id]/reject-copy", () => {
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

  it("returns 403 when caller has CLIENT role only", async () => {
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

  it("returns 404 when experience is not owned by the caller", async () => {
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
    (prisma.experience.findFirst as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ...pendingTripperReviewExperience("tripper-1"), status: "DRAFT" })
      .mockResolvedValueOnce(reviewCopy());
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
      .mockResolvedValueOnce(null);
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makePostRequest("exp-1"), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 200 on happy path — copy INACTIVE, original DRAFT", async () => {
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
            update: vi.fn()
              .mockResolvedValueOnce({ id: "copy-1", status: "INACTIVE" })
              .mockResolvedValueOnce({ id: "exp-1", status: "DRAFT" }),
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
