import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    experience: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { getTripperBySlug } from "../tripper-queries";
import { prisma } from "@/lib/prisma";

const findUniqueMock = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const findManyMock = prisma.experience.findMany as ReturnType<typeof vi.fn>;

describe("getTripperBySlug — three-way discriminated result", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue([]);
  });

  it("returns status: not_found when no User row matches the slug", async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await getTripperBySlug("nobody");

    expect(result).toEqual({ status: "not_found" });
  });

  it("returns status: not_found when the User row has no persisted tripperSlug", async () => {
    findUniqueMock.mockResolvedValue({
      id: "u1",
      name: "Ana",
      nickname: null,
      tripperSlug: null,
      isActive: true,
    });

    const result = await getTripperBySlug("ana");

    expect(result).toEqual({ status: "not_found" });
  });

  it("returns status: inactive with the tripper's name, and skips the Experience query", async () => {
    findUniqueMock.mockResolvedValue({
      id: "u2",
      name: "Florencia Denis",
      nickname: "Flor",
      tripperSlug: "florencia-denis",
      isActive: false,
      email: "flor@example.com",
      avatarUrl: null,
      roles: ["TRIPPER"],
      commission: null,
      interests: [],
      bio: "",
      heroImage: "",
      heroImagePositionX: null,
      heroImagePositionY: null,
      location: null,
      tierLevel: "wanderer",
      destinations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getTripperBySlug("florencia-denis");

    expect(result).toEqual({ status: "inactive", name: "Flor" });
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("falls back to the legal name for status: inactive when no nickname is set", async () => {
    findUniqueMock.mockResolvedValue({
      id: "u3",
      name: "Santiago Senega",
      nickname: null,
      tripperSlug: "santiago-senega",
      isActive: false,
      email: "santi@example.com",
      avatarUrl: null,
      roles: ["TRIPPER"],
      commission: null,
      interests: [],
      bio: "",
      heroImage: "",
      heroImagePositionX: null,
      heroImagePositionY: null,
      location: null,
      tierLevel: "wanderer",
      destinations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getTripperBySlug("santiago-senega");

    expect(result).toEqual({ status: "inactive", name: "Santiago Senega" });
  });

  it("returns status: ok with the tripper profile when active", async () => {
    findUniqueMock.mockResolvedValue({
      id: "u4",
      name: "Ana Lopez",
      nickname: null,
      tripperSlug: "ana-lopez",
      isActive: true,
      email: "ana@example.com",
      avatarUrl: null,
      roles: ["TRIPPER"],
      commission: 0.15,
      interests: [],
      bio: "",
      heroImage: "",
      heroImagePositionX: null,
      heroImagePositionY: null,
      location: null,
      tierLevel: "wanderer",
      destinations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    findManyMock.mockResolvedValue([{ type: ["solo"] }]);

    const result = await getTripperBySlug("ana-lopez");

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.tripper.tripperSlug).toBe("ana-lopez");
      expect(result.tripper.availableTypes).toEqual(["solo"]);
    }
  });

  it("rethrows a genuine DB error instead of collapsing it into not_found", async () => {
    findUniqueMock.mockRejectedValue(new Error("connection reset"));

    await expect(getTripperBySlug("whoever")).rejects.toThrow(
      "connection reset",
    );
  });

  it("rethrows when the later Experience query fails, not just the User lookup", async () => {
    findUniqueMock.mockResolvedValue({
      id: "u5",
      name: "Ok Tripper",
      nickname: null,
      tripperSlug: "ok-tripper",
      isActive: true,
      email: "ok@example.com",
      avatarUrl: null,
      roles: ["TRIPPER"],
      commission: null,
      interests: [],
      bio: "",
      heroImage: "",
      heroImagePositionX: null,
      heroImagePositionY: null,
      location: null,
      tierLevel: "wanderer",
      destinations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    findManyMock.mockRejectedValue(new Error("experience query blew up"));

    await expect(getTripperBySlug("ok-tripper")).rejects.toThrow(
      "experience query blew up",
    );
  });
});
