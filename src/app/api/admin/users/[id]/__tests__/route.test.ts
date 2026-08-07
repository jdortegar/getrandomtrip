import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

type RouteModule = typeof import("../route");

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db/tripper-queries", () => ({
  generateUniqueTripperSlug: vi.fn().mockResolvedValue("some-slug"),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const mockSession = (userId: string) => ({
  user: { id: userId, email: "admin@example.com" },
});
const mockAdminCaller = (id: string) => ({ id, roles: ["ADMIN"] });

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/users/target-1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeProps(id = "target-1") {
  return { params: Promise.resolve({ id }) };
}

describe("PATCH /api/admin/users/[id] — commission", () => {
  let PATCH: RouteModule["PATCH"];

  beforeEach(async () => {
    vi.resetAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminCaller("admin-1"),
    );
    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "target-1",
      roles: ["TRAVELER", "TRIPPER"],
      tripperSlug: "some-slug",
      commission: 0.2,
    });
    const mod = (await import("../route")) as RouteModule;
    PATCH = mod.PATCH;
  });

  it("converts a valid whole-percent commission to a fraction before writing", async () => {
    const res = await PATCH(
      makeRequest({ roles: ["TRAVELER", "TRIPPER"], commission: 20 }),
      makeProps(),
    );

    expect(res.status).toBe(200);
    const updateArgs = (prisma.user.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(updateArgs.data.commission).toBe(0.2);
  });

  it("rejects an out-of-range commission with 400 and never calls update", async () => {
    const res = await PATCH(
      makeRequest({ roles: ["TRAVELER", "TRIPPER"], commission: 150 }),
      makeProps(),
    );

    expect(res.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects a non-integer commission with 400 and never calls update", async () => {
    const res = await PATCH(
      makeRequest({ roles: ["TRAVELER", "TRIPPER"], commission: 12.5 }),
      makeProps(),
    );

    expect(res.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects a string commission with 400 and never calls update", async () => {
    const res = await PATCH(
      makeRequest({ roles: ["TRAVELER", "TRIPPER"], commission: "20" }),
      makeProps(),
    );

    expect(res.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("omits commission from the update data when absent from the body", async () => {
    const res = await PATCH(
      makeRequest({ roles: ["TRAVELER", "TRIPPER"] }),
      makeProps(),
    );

    expect(res.status).toBe(200);
    const updateArgs = (prisma.user.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect("commission" in updateArgs.data).toBe(false);
  });

  it("still returns 401 when session is missing", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await PATCH(
      makeRequest({ roles: ["TRAVELER", "TRIPPER"], commission: 20 }),
      makeProps(),
    );
    expect(res.status).toBe(401);
  });

  it("still returns 403 for a non-admin caller", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      roles: ["TRAVELER"],
    });
    const res = await PATCH(
      makeRequest({ roles: ["TRAVELER", "TRIPPER"], commission: 20 }),
      makeProps(),
    );
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/admin/users/[id] — tripperSince", () => {
  let PATCH: RouteModule["PATCH"];

  beforeEach(async () => {
    vi.resetAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("admin-1"),
    );
    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "target-1",
      roles: ["TRAVELER", "TRIPPER"],
      tripperSlug: "some-slug",
      commission: null,
    });
    const mod = (await import("../route")) as RouteModule;
    PATCH = mod.PATCH;
  });

  it("sets tripperSince when granting TRIPPER to a user who didn't already have it", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockAdminCaller("admin-1")) // caller lookup
      .mockResolvedValueOnce({
        name: "Alice",
        roles: ["TRAVELER"],
        tripperSlug: null,
      }); // target lookup

    const res = await PATCH(
      makeRequest({ roles: ["TRAVELER", "TRIPPER"] }),
      makeProps(),
    );

    expect(res.status).toBe(200);
    const updateArgs = (prisma.user.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(updateArgs.data.tripperSince).toBeInstanceOf(Date);
  });

  it("does not set tripperSince when the target already has TRIPPER", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockAdminCaller("admin-1")) // caller lookup
      .mockResolvedValueOnce({
        name: "Bob",
        roles: ["TRAVELER", "TRIPPER"],
        tripperSlug: "bob-slug",
      }); // target lookup

    const res = await PATCH(
      makeRequest({ roles: ["TRAVELER", "TRIPPER"] }),
      makeProps(),
    );

    expect(res.status).toBe(200);
    const updateArgs = (prisma.user.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(updateArgs.data.tripperSince).toBeUndefined();
  });

  it("does not touch tripperSince when TRIPPER isn't in the target roles at all", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAdminCaller("admin-1"),
    ); // caller lookup only — target lookup is skipped since roles has no TRIPPER

    const res = await PATCH(
      makeRequest({ roles: ["TRAVELER"] }),
      makeProps(),
    );

    expect(res.status).toBe(200);
    const updateArgs = (prisma.user.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(updateArgs.data.tripperSince).toBeUndefined();
  });
});
