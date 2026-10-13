import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const tx = vi.hoisted(() => ({
  tripRequest: { updateMany: vi.fn() },
  user: { update: vi.fn() },
}));

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripRequest: { findUnique: vi.fn() },
    $transaction: vi.fn(async (run: (client: typeof tx) => unknown) => run(tx)),
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { PATCH } from "../route";

const sessionMock = getServerSession as ReturnType<typeof vi.fn>;
const findTripMock = prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>;
const transactionMock = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

function patch(body: unknown, id = "trip-1") {
  const request = new NextRequest(`http://localhost/api/trips/${id}/buyer-documents`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return PATCH(request, { params: Promise.resolve({ id }) });
}

function trip(overrides: Record<string, unknown> = {}) {
  return { id: "trip-1", userId: "user-1", status: "PENDING_PAYMENT", payment: { status: "PENDING" }, ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.mockResolvedValue({ user: { id: "user-1" } });
  findTripMock.mockResolvedValue(trip());
  tx.tripRequest.updateMany.mockResolvedValue({ count: 1 });
  tx.user.update.mockResolvedValue({});
});

describe("PATCH /api/trips/[id]/buyer-documents", () => {
  it("rejects unauthenticated requests", async () => {
    sessionMock.mockResolvedValue(null);
    const res = await patch({ nationalities: ["AR"], visas: [] });
    expect(res.status).toBe(401);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown trip", async () => {
    findTripMock.mockResolvedValue(null);
    const res = await patch({ nationalities: ["AR"], visas: [] });
    expect(res.status).toBe(404);
  });

  it("forbids anyone but the trip owner", async () => {
    findTripMock.mockResolvedValue(trip({ userId: "someone-else" }));
    const res = await patch({ nationalities: ["AR"], visas: [] });
    expect(res.status).toBe(403);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("requires at least one nationality", async () => {
    const res = await patch({ nationalities: [], visas: [] });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "At least one nationality is required", invalid: [] });
    expect(transactionMock).not.toHaveBeenCalled();
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

  it("rejects a malformed body", async () => {
    expect((await patch("{not json")).status).toBe(400);
    expect((await patch({ nationalities: "AR" })).status).toBe(400);
  });

  it.each([
    ["a confirmed trip", trip({ status: "CONFIRMED" })],
    ["an approved payment", trip({ payment: { status: "APPROVED" } })],
  ])("rejects edits once checkout is locked (%s)", async (_label, locked) => {
    findTripMock.mockResolvedValue(locked);
    const res = await patch({ nationalities: ["AR"], visas: [] });
    expect(res.status).toBe(409);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("returns 409 when the trip locks between the read and the write", async () => {
    tx.tripRequest.updateMany.mockResolvedValue({ count: 0 });
    const res = await patch({ nationalities: ["AR"], visas: [] });
    expect(res.status).toBe(409);
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it("writes the trip snapshot and the profile in one transaction", async () => {
    const res = await patch({ nationalities: ["it", "AR", "AR"], visas: ["us", "SCHENGEN"] });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      buyerNationalities: ["IT", "AR"],
      buyerVisas: ["US", "SCHENGEN"],
    });
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(tx.tripRequest.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        id: "trip-1",
        userId: "user-1",
        status: { in: ["DRAFT", "SAVED", "PENDING_PAYMENT"] },
      }),
      data: { buyerNationalities: ["IT", "AR"], buyerVisas: ["US", "SCHENGEN"] },
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { nationalities: ["IT", "AR"], approvedVisas: ["US", "SCHENGEN"] },
    });
  });

  it("treats missing visas as none", async () => {
    const res = await patch({ nationalities: ["AR"] });
    expect(res.status).toBe(200);
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { nationalities: ["AR"], approvedVisas: [] },
    });
  });
});
