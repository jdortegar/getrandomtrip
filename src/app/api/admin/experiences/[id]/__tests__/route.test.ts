import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

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
    experience: { update: vi.fn() },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

type RouteModule = typeof import("../route");

const mockSession = (userId: string) => ({
  user: { id: userId, email: "admin@example.com" },
});

const mockAdminUser = (id: string) => ({ id, roles: ["ADMIN"] });
const mockTravelerUser = (id: string) => ({ id, roles: ["TRAVELER"] });

function makeProps(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/experiences/exp-1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/admin/experiences/[id]", () => {
  let PATCH: RouteModule["PATCH"];

  beforeEach(async () => {
    vi.resetAllMocks();
    const mod = (await import("../route")) as RouteModule;
    PATCH = mod.PATCH;
  });

  it("returns 401 when session is missing", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await PATCH(makeRequest({}), makeProps("exp-1"));
    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin caller", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("user-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockTravelerUser("user-1"),
    );

    const res = await PATCH(makeRequest({ status: "ARCHIVED" }), makeProps("exp-1"));
    expect(res.status).toBe(403);
    expect(prisma.experience.update).not.toHaveBeenCalled();
  });

  it("toggles isActive as before", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.experience.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "exp-1",
      isActive: false,
      isFeatured: false,
      status: "ACTIVE",
      updatedAt: new Date(),
    });

    const res = await PATCH(makeRequest({ isActive: false }), makeProps("exp-1"));
    expect(res.status).toBe(200);
    expect(prisma.experience.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } }),
    );
  });

  it("archives an experience when status is ARCHIVED", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );
    (prisma.experience.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "exp-1",
      isActive: true,
      isFeatured: false,
      status: "ARCHIVED",
      updatedAt: new Date(),
    });

    const res = await PATCH(makeRequest({ status: "ARCHIVED" }), makeProps("exp-1"));
    expect(res.status).toBe(200);
    expect(prisma.experience.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "ARCHIVED" } }),
    );
  });

  it("ignores a non-ARCHIVED status value rather than applying it", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );

    const res = await PATCH(makeRequest({ status: "PENDING_REVIEW" }), makeProps("exp-1"));
    expect(res.status).toBe(400);
    expect(prisma.experience.update).not.toHaveBeenCalled();
  });

  it("returns 400 when no valid fields are provided", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession("admin-1"));
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminUser("admin-1"),
    );

    const res = await PATCH(makeRequest({}), makeProps("exp-1"));
    expect(res.status).toBe(400);
    expect(prisma.experience.update).not.toHaveBeenCalled();
  });
});
