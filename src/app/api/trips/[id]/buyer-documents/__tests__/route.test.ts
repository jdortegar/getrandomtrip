import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripRequest: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    user: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { PATCH } from "../route";

const sessionMock = getServerSession as ReturnType<typeof vi.fn>;
const findTripMock = prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>;
const updateUserMock = prisma.user.update as ReturnType<typeof vi.fn>;

function patch(body: unknown, id = "trip-1") {
  const request = new NextRequest(`http://localhost/api/trips/${id}/buyer-documents`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return PATCH(request, { params: Promise.resolve({ id }) });
}

function trip(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { id: "trip-1", userId: "user-1", status: "PENDING_PAYMENT", ...overrides };
}

function noTripWrites() {
  expect(prisma.tripRequest.update).not.toHaveBeenCalled();
  expect(prisma.tripRequest.updateMany).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.mockResolvedValue({ user: { id: "user-1" } });
  findTripMock.mockResolvedValue(trip());
  updateUserMock.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    nationalities: data.nationalities ?? ["AR"],
    approvedVisas: data.approvedVisas ?? ["United States"],
    passportCountry: null,
  }));
});

describe("PATCH /api/trips/[id]/buyer-documents (linked = live)", () => {
  it("rejects unauthenticated requests", async () => {
    sessionMock.mockResolvedValue(null);
    const res = await patch({ nationalities: ["AR"], visas: [] });
    expect(res.status).toBe(401);
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown trip", async () => {
    findTripMock.mockResolvedValue(null);
    const res = await patch({ nationalities: ["AR"], visas: [] });
    expect(res.status).toBe(404);
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("forbids anyone but the trip owner (companions included)", async () => {
    findTripMock.mockResolvedValue(trip({ userId: "someone-else" }));
    const res = await patch({ nationalities: ["AR"], visas: [] });
    expect(res.status).toBe(403);
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("requires at least one nationality when nationalities are sent", async () => {
    const res = await patch({ nationalities: [], visas: [] });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "At least one nationality is required", invalid: [] });
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("rejects non-ISO nationalities and zone codes as nationalities", async () => {
    const res = await patch({ nationalities: ["AR", "Argentina", "SCHENGEN"], visas: [] });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid nationalities", invalid: ["Argentina", "SCHENGEN"] });
  });

  it("rejects unknown visa codes", async () => {
    const res = await patch({ nationalities: ["AR"], visas: ["SCHENGEN", "XX1"] });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid visas", invalid: ["XX1"] });
  });

  it("rejects a malformed body or a body with no list", async () => {
    expect((await patch("{not json")).status).toBe(400);
    expect((await patch({ nationalities: "AR" })).status).toBe(400);
    expect((await patch({})).status).toBe(400);
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("writes only the owner's profile, never the trip snapshot, and answers the live values", async () => {
    const res = await patch({ nationalities: ["IT", "AR"], visas: ["SCHENGEN", "US"] });

    expect(res.status).toBe(200);
    expect(updateUserMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { nationalities: ["IT", "AR"], approvedVisas: ["SCHENGEN", "US"] },
      select: { nationalities: true, approvedVisas: true, passportCountry: true },
    });
    noTripWrites();
    expect(await res.json()).toEqual({
      buyerNationalities: ["IT", "AR"],
      buyerVisas: ["SCHENGEN", "US"],
    });
  });

  it("leaves an omitted list unchanged", async () => {
    const res = await patch({ visas: ["US"] });

    expect(res.status).toBe(200);
    expect(updateUserMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: { approvedVisas: ["US"] } }),
    );
    expect(await res.json()).toEqual({ buyerNationalities: ["AR"], buyerVisas: ["US"] });
  });

  it.each([
    ["checkout", { status: "PENDING_PAYMENT" }],
    ["paid and roster locked", { status: "CONFIRMED", travelersLockedAt: new Date("2026-01-01T00:00:00Z") }],
    ["revealed", { status: "REVEALED" }],
    ["completed (ended)", { status: "COMPLETED", endDate: new Date("2020-01-01T00:00:00Z") }],
  ])("has no lock rule: saves while %s", async (_label, overrides) => {
    findTripMock.mockResolvedValue(trip(overrides));
    const res = await patch({ nationalities: ["CO"], visas: ["GB"] });
    expect(res.status).toBe(200);
    expect(updateUserMock).toHaveBeenCalledTimes(1);
  });

  it("rejects every edit once the trip is cancelled", async () => {
    findTripMock.mockResolvedValue(trip({ status: "CANCELLED" }));
    const res = await patch({ nationalities: ["AR"], visas: [] });
    expect(res.status).toBe(409);
    expect(updateUserMock).not.toHaveBeenCalled();
    noTripWrites();
  });
});
