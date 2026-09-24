import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    experience: { findFirst: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
  },
}));
vi.mock("@/lib/experiences/deletion", () => ({ deleteExperienceIfAllowed: vi.fn() }));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { deleteExperienceIfAllowed } from "@/lib/experiences/deletion";
import { DELETE } from "../route";

const session = getServerSession as ReturnType<typeof vi.fn>;
const findUser = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const findExperience = prisma.experience.findFirst as ReturnType<typeof vi.fn>;
const deleteIfAllowed = deleteExperienceIfAllowed as ReturnType<typeof vi.fn>;

const call = () =>
  DELETE(new NextRequest("http://localhost/api/tripper/experiences/e1", { method: "DELETE" }), {
    params: Promise.resolve({ id: "e1" }),
  });

describe("DELETE /api/tripper/experiences/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    session.mockResolvedValue({ user: { id: "u1" } });
    findUser.mockResolvedValue({ id: "u1", roles: ["TRIPPER"] });
    findExperience.mockResolvedValue({ id: "e1" });
  });

  it("rejects callers without the role", async () => {
    findUser.mockResolvedValue({ id: "u1", roles: ["TRAVELER"] });
    expect((await call()).status).toBe(403);
    expect(deleteIfAllowed).not.toHaveBeenCalled();
  });

  it("deletes through the shared rule and returns success", async () => {
    deleteIfAllowed.mockResolvedValue({ ok: true });
    const res = await call();
    expect(res.status).toBe(200);
    expect(deleteIfAllowed).toHaveBeenCalledWith("e1");
    expect(prisma.experience.delete).not.toHaveBeenCalled();
  });

  it.each(["has_bookings", "in_review"])("returns 409 with the reason when blocked (%s)", async (reason) => {
    deleteIfAllowed.mockResolvedValue({ ok: false, reason });
    const res = await call();
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ reason });
  });

  it("returns 404 when the experience does not exist", async () => {
    findExperience.mockResolvedValue(null);
    deleteIfAllowed.mockResolvedValue({ ok: false, reason: "not_found" });
    expect((await call()).status).toBe(404);
  });
});
