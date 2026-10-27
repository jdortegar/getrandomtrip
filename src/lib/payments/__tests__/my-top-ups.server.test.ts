import { beforeEach, describe, expect, it, vi } from "vitest";
const db = vi.hoisted(() => ({ paymentShare: { findMany: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
import { loadMyTopUps } from "../my-top-ups.server";

const NOW = new Date("2026-10-31T12:00:00.000Z");
const open = { id: "trip-1", status: "CONFIRMED", topUpDeadline: new Date("2026-11-01T12:00:00.000Z") };

describe("loadMyTopUps", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns the viewer's own unpaid top-up per trip in its grace period", async () => {
    db.paymentShare.findMany.mockResolvedValue([
      { id: "topup-1", amount: 17.5, currency: "USD", payment: { tripRequestId: "trip-1" } },
    ]);
    const result = await loadMyTopUps([open] as never, "ana", NOW);
    expect(result).toEqual({
      "trip-1": { shareId: "topup-1", amount: 17.5, currency: "USD", deadline: "2026-11-01T12:00:00.000Z" },
    });
    expect(db.paymentShare.findMany).toHaveBeenCalledWith({
      where: {
        kind: "TOP_UP",
        userId: "ana",
        status: { in: ["PENDING", "FAILED", "CANCELLED", "REJECTED"] },
        payment: { tripRequestId: { in: ["trip-1"] } },
      },
      select: { id: true, amount: true, currency: true, payment: { select: { tripRequestId: true } } },
    });
  });

  it.each([
    ["the grace period ended", { ...open, topUpDeadline: new Date("2026-10-31T11:59:59.000Z") }],
    ["the trip is still collecting", { ...open, status: "COLLECTING" }],
    ["the trip has no top-ups", { ...open, topUpDeadline: null }],
  ])("skips the query when %s", async (_label, trip) => {
    expect(await loadMyTopUps([trip] as never, "ana", NOW)).toEqual({});
    expect(db.paymentShare.findMany).not.toHaveBeenCalled();
  });
});
