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
      findFirst: vi.fn(),
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
  user: { id: userId, email: "tripper@example.com" },
});

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/user/tripper", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("PATCH /api/user/tripper — commission lockdown", () => {
  let PATCH: RouteModule["PATCH"];

  beforeEach(async () => {
    vi.resetAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("tripper-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      name: "Some Tripper",
      roles: ["TRAVELER"],
    });
    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "tripper-1",
      name: "Some Tripper",
      email: "tripper@example.com",
      avatarUrl: null,
      roles: ["TRAVELER", "TRIPPER"],
      bio: "",
      heroImage: "",
      location: "",
      nickname: "",
      socialLinks: [],
      tierLevel: "",
      destinations: [],
      tripperSlug: "some-slug",
      commission: null,
      availableTypes: ["classic"],
      interests: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const mod = (await import("../route")) as RouteModule;
    PATCH = mod.PATCH;
  });

  it("never writes a client-submitted commission to the database", async () => {
    const res = await PATCH(
      makeRequest({ commission: 10, availableTypes: ["classic"] }),
    );

    expect(res.status).toBe(200);
    const updateArgs = (prisma.user.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect("commission" in updateArgs.data).toBe(false);
  });

  it("succeeds without a commission value, given a valid availableTypes list", async () => {
    const res = await PATCH(makeRequest({ availableTypes: ["classic"] }));
    expect(res.status).toBe(200);
  });

  it("still rejects an empty availableTypes with 400", async () => {
    const res = await PATCH(makeRequest({ availableTypes: [] }));
    expect(res.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("still rejects a missing availableTypes with 400", async () => {
    const res = await PATCH(makeRequest({}));
    expect(res.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/user/tripper — tripperSlug format validation", () => {
  let PATCH: RouteModule["PATCH"];

  beforeEach(async () => {
    vi.resetAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("tripper-1"),
    );
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      name: "Some Tripper",
      roles: ["TRAVELER"],
    });
    (prisma.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "tripper-1",
      roles: ["TRAVELER", "TRIPPER"],
      tripperSlug: "j-doe",
      availableTypes: ["classic"],
    });
    const mod = (await import("../route")) as RouteModule;
    PATCH = mod.PATCH;
  });

  it("rejects a slug containing a dot (would break the signed attribution cookie's dot-delimited parsing)", async () => {
    const res = await PATCH(
      makeRequest({ tripperSlug: "j.doe", availableTypes: ["classic"] }),
    );
    expect(res.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects a slug with uppercase letters", async () => {
    const res = await PATCH(
      makeRequest({ tripperSlug: "JDoe", availableTypes: ["classic"] }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a slug with a leading dash", async () => {
    const res = await PATCH(
      makeRequest({ tripperSlug: "-jdoe", availableTypes: ["classic"] }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a slug with a double dash", async () => {
    const res = await PATCH(
      makeRequest({ tripperSlug: "j--doe", availableTypes: ["classic"] }),
    );
    expect(res.status).toBe(400);
  });

  it("accepts a valid lowercase-alphanumeric-and-dash slug", async () => {
    const res = await PATCH(
      makeRequest({ tripperSlug: "j-doe-2", availableTypes: ["classic"] }),
    );
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/user/tripper — tripperSince", () => {
  let PATCH: RouteModule["PATCH"];

  beforeEach(async () => {
    vi.resetAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSession("tripper-1"),
    );
    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "tripper-1",
      roles: ["TRAVELER", "TRIPPER"],
      tripperSlug: "some-slug",
      availableTypes: ["classic"],
    });
    const mod = (await import("../route")) as RouteModule;
    PATCH = mod.PATCH;
  });

  it("sets tripperSince the first time a traveler saves as a tripper", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      name: "Some Traveler",
      roles: ["TRAVELER"],
    });

    const res = await PATCH(makeRequest({ availableTypes: ["classic"] }));

    expect(res.status).toBe(200);
    const updateArgs = (prisma.user.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(updateArgs.data.tripperSince).toBeInstanceOf(Date);
  });

  it("does not overwrite tripperSince on a subsequent save by an existing tripper", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      name: "Some Tripper",
      roles: ["TRAVELER", "TRIPPER"],
    });

    const res = await PATCH(makeRequest({ availableTypes: ["classic"] }));

    expect(res.status).toBe(200);
    const updateArgs = (prisma.user.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(updateArgs.data.tripperSince).toBeUndefined();
  });
});
