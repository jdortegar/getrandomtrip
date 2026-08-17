import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    tripRequest: { count: vi.fn() },
    experience: { count: vi.fn() },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { POST } from "../route";

const getServerSessionMock = getServerSession as ReturnType<typeof vi.fn>;
const findUniqueMock = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const updateMock = prisma.user.update as ReturnType<typeof vi.fn>;
const tripCountMock = prisma.tripRequest.count as ReturnType<typeof vi.fn>;
const experienceCountMock = prisma.experience.count as ReturnType<
  typeof vi.fn
>;

describe("POST /api/user/deactivate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(401);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("blocks admin accounts without checking trips/experiences", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1" } });
    findUniqueMock.mockResolvedValue({ id: "u1", roles: ["ADMIN"] });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.reasons).toEqual(["ADMIN_ROLE"]);
    expect(tripCountMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("blocks when the user has an active trip, and does not deactivate", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u2" } });
    findUniqueMock.mockResolvedValue({ id: "u2", roles: ["TRAVELER"] });
    tripCountMock.mockResolvedValue(1);
    experienceCountMock.mockResolvedValue(0);

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.reasons).toEqual(["ACTIVE_TRIPS"]);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("blocks when the tripper owns experiences, and does not deactivate", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u3" } });
    findUniqueMock.mockResolvedValue({ id: "u3", roles: ["TRAVELER", "TRIPPER"] });
    tripCountMock.mockResolvedValue(0);
    experienceCountMock.mockResolvedValue(2);

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.reasons).toEqual(["OWNED_EXPERIENCES"]);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("on success, soft-deletes: sets deactivatedAt and isActive=false, no hard delete", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u4" } });
    findUniqueMock.mockResolvedValue({ id: "u4", roles: ["TRAVELER"] });
    tripCountMock.mockResolvedValue(0);
    experienceCountMock.mockResolvedValue(0);
    updateMock.mockResolvedValue({});

    const response = await POST();

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledTimes(1);
    const callArgs = updateMock.mock.calls[0][0];
    expect(callArgs.where).toEqual({ id: "u4" });
    expect(callArgs.data.isActive).toBe(false);
    expect(callArgs.data.deactivatedAt).toBeInstanceOf(Date);
  });
});
