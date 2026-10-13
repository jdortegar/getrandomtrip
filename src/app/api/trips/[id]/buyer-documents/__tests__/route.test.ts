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

function trip(overrides: Record<string, unknown> = {}): Record<string, unknown> {
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

  describe("after payment", () => {
    const DAY = 24 * 60 * 60 * 1000;
    const paidTrip = (overrides: Record<string, unknown> = {}) =>
      trip({
        status: "CONFIRMED",
        payment: { status: "APPROVED" },
        type: "couple",
        startDate: new Date(Date.now() + 60 * DAY),
        endDate: new Date(Date.now() + 65 * DAY),
        departureTimeZone: null,
        travelersLockedAt: null,
        buyerNationalities: [],
        buyerVisas: [],
        ...overrides,
      });

    it("lets the buyer edit while the roster is unlocked", async () => {
      const paid = paidTrip();
      findTripMock.mockResolvedValue(paid);
      const res = await patch({ nationalities: ["AR", "IT"], visas: ["US"] });
      expect(res.status).toBe(200);
      expect(tx.tripRequest.updateMany).toHaveBeenCalledWith({
        where: {
          id: "trip-1",
          userId: "user-1",
          status: { in: ["CONFIRMED", "REVEALED"] },
          payment: { is: { status: "APPROVED" } },
          type: "couple",
          startDate: paid.startDate,
          endDate: paid.endDate,
          departureTimeZone: null,
          travelersLockedAt: null,
        },
        data: { buyerNationalities: ["AR", "IT"], buyerVisas: ["US"] },
      });
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { nationalities: ["AR", "IT"], approvedVisas: ["US"] },
      });
    });

    it("also accepts a revealed trip", async () => {
      findTripMock.mockResolvedValue(paidTrip({ status: "REVEALED" }));
      expect((await patch({ nationalities: ["AR"] })).status).toBe(200);
    });

    it.each([
      ["the trip is cancelled", { status: "CANCELLED" }],
      ["the trip is completed", { status: "COMPLETED" }],
      ["the trip has ended", { startDate: null, endDate: new Date(Date.now() - 2 * DAY) }],
      ["the payment was refunded", { payment: { status: "REFUNDED" } }],
    ])("returns 409 when %s", async (_label, overrides) => {
      findTripMock.mockResolvedValue(paidTrip(overrides));
      const res = await patch({ nationalities: ["AR"], visas: [] });
      expect(res.status).toBe(409);
      expect(transactionMock).not.toHaveBeenCalled();
    });

    describe("once the roster is locked (companion rule: empty lists stay fillable)", () => {
      const lockedCases = [
        ["locked manually", { travelersLockedAt: new Date() }],
        ["past the cutoff", { startDate: new Date(Date.now() + 1 * DAY), endDate: null }],
      ] as const;

      it.each(lockedCases)("fills empty lists (%s)", async (_label, lock) => {
        const locked = paidTrip({ ...lock });
        findTripMock.mockResolvedValue(locked);
        const res = await patch({ nationalities: ["AR"], visas: ["US"] });
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ buyerNationalities: ["AR"], buyerVisas: ["US"] });
        expect(tx.tripRequest.updateMany).toHaveBeenCalledWith({
          where: expect.objectContaining({
            status: { in: ["CONFIRMED", "REVEALED"] },
            payment: { is: { status: "APPROVED" } },
            travelersLockedAt: locked.travelersLockedAt,
            buyerNationalities: { equals: [] },
            buyerVisas: { equals: [] },
          }),
          data: { buyerNationalities: ["AR"], buyerVisas: ["US"] },
        });
        expect(tx.user.update).toHaveBeenCalledWith({
          where: { id: "user-1" },
          data: { nationalities: ["AR"], approvedVisas: ["US"] },
        });
      });

      it.each(lockedCases)("rejects changing a populated list (%s)", async (_label, lock) => {
        findTripMock.mockResolvedValue(paidTrip({ ...lock, buyerNationalities: ["AR"] }));
        const res = await patch({ nationalities: ["AR", "IT"], visas: [] });
        expect(res.status).toBe(409);
        expect(await res.json()).toEqual({ error: "Trip is no longer editable" });
        expect(transactionMock).not.toHaveBeenCalled();
      });

      it("freezes visas independently of nationalities", async () => {
        findTripMock.mockResolvedValue(
          paidTrip({ travelersLockedAt: new Date(), buyerNationalities: [], buyerVisas: ["US"] }),
        );
        expect((await patch({ nationalities: ["AR"], visas: [] })).status).toBe(409);
        expect(transactionMock).not.toHaveBeenCalled();
      });

      it("writes only the lists sent, so a frozen list can be left out", async () => {
        findTripMock.mockResolvedValue(
          paidTrip({ travelersLockedAt: new Date(), buyerNationalities: ["AR"], buyerVisas: [] }),
        );
        const res = await patch({ visas: ["SCHENGEN"] });
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ buyerNationalities: ["AR"], buyerVisas: ["SCHENGEN"] });
        const call = tx.tripRequest.updateMany.mock.calls[0][0];
        expect(call.data).toEqual({ buyerVisas: ["SCHENGEN"] });
        expect(call.where.buyerVisas).toEqual({ equals: [] });
        expect(call.where).not.toHaveProperty("buyerNationalities");
        expect(tx.user.update).toHaveBeenCalledWith({
          where: { id: "user-1" },
          data: { approvedVisas: ["SCHENGEN"] },
        });
      });

      it("accepts re-saving a populated list unchanged", async () => {
        findTripMock.mockResolvedValue(
          paidTrip({ travelersLockedAt: new Date(), buyerNationalities: ["AR", "IT"], buyerVisas: [] }),
        );
        const res = await patch({ nationalities: ["IT", "AR"], visas: ["US"] });
        expect(res.status).toBe(200);
      });

      it("still requires a nationality when nationalities are sent", async () => {
        findTripMock.mockResolvedValue(paidTrip({ travelersLockedAt: new Date() }));
        expect((await patch({ nationalities: [], visas: ["US"] })).status).toBe(400);
      });

      it("rejects a body with no list", async () => {
        findTripMock.mockResolvedValue(paidTrip({ travelersLockedAt: new Date() }));
        expect((await patch({})).status).toBe(400);
        expect(transactionMock).not.toHaveBeenCalled();
      });

      it("returns 409 when a list was filled concurrently", async () => {
        findTripMock.mockResolvedValue(paidTrip({ travelersLockedAt: new Date() }));
        tx.tripRequest.updateMany.mockResolvedValue({ count: 0 });
        expect((await patch({ nationalities: ["AR"] })).status).toBe(409);
        expect(tx.user.update).not.toHaveBeenCalled();
      });

      it("still rejects every edit once the trip is cancelled", async () => {
        findTripMock.mockResolvedValue(paidTrip({ travelersLockedAt: new Date(), status: "CANCELLED" }));
        expect((await patch({ nationalities: ["AR"] })).status).toBe(409);
      });
    });

    it("still requires nationalities before the roster locks", async () => {
      findTripMock.mockResolvedValue(paidTrip());
      expect((await patch({ visas: ["US"] })).status).toBe(400);
    });

    it("returns 409 when a lock input changes between the read and the write", async () => {
      findTripMock.mockResolvedValue(paidTrip());
      tx.tripRequest.updateMany.mockResolvedValue({ count: 0 });
      const res = await patch({ nationalities: ["AR"] });
      expect(res.status).toBe(409);
      expect(tx.user.update).not.toHaveBeenCalled();
    });

    it("still forbids anyone but the buyer (companions included)", async () => {
      findTripMock.mockResolvedValue(paidTrip({ userId: "buyer-1" }));
      const res = await patch({ nationalities: ["AR"] });
      expect(res.status).toBe(403);
      expect(transactionMock).not.toHaveBeenCalled();
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
