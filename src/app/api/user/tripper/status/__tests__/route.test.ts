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
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { PATCH } from "../route";

const getServerSessionMock = getServerSession as ReturnType<typeof vi.fn>;
const findUniqueMock = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const updateMock = prisma.user.update as ReturnType<typeof vi.fn>;

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/user/tripper/status", {
    method: "PATCH",
    body: JSON.stringify(body),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

describe("PATCH /api/user/tripper/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await PATCH(makeRequest({ isActive: false }));

    expect(response.status).toBe(401);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns 400 when isActive is not a boolean", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1" } });

    const response = await PATCH(makeRequest({ isActive: "yes" }));

    expect(response.status).toBe(400);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the caller's tripperSlug is null, and does not write", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1" } });
    findUniqueMock.mockResolvedValue({ tripperSlug: null });

    const response = await PATCH(makeRequest({ isActive: false }));

    expect(response.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("on success, updates only isActive — data keys are exactly ['isActive']", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1" } });
    findUniqueMock.mockResolvedValue({ tripperSlug: "florencia-denis-magyari" });
    updateMock.mockResolvedValue({
      isActive: false,
      tripperSlug: "florencia-denis-magyari",
    });

    const response = await PATCH(makeRequest({ isActive: false }));

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledTimes(1);
    const callArgs = updateMock.mock.calls[0][0];
    expect(Object.keys(callArgs.data)).toEqual(["isActive"]);
    expect(callArgs.data.isActive).toBe(false);
    const body = await response.json();
    expect(body.user.tripperSlug).toBe("florencia-denis-magyari");
  });
});
