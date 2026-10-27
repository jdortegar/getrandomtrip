import { beforeEach, describe, expect, it, vi } from "vitest";
const db = vi.hoisted(() => ({ paymentShare: { findMany: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
import { loadMyTopUps } from "../my-top-ups.server";

const NOW = new Date("2026-10-31T12:00:00.000Z");
const inGrace = {
  id: "trip-1",
  status: "CONFIRMED",
  paymentMode: "INDIVIDUAL",
  topUpDeadline: new Date("2026-11-01T12:00:00.000Z"),
};

describe("loadMyTopUps", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns the viewer's own unpaid top-up while the grace period is open", async () => {
    db.paymentShare.findMany.mockResolvedValue([
      { id: "topup-1", kind: "TOP_UP", amount: 17.5, currency: "USD", payment: { tripRequestId: "trip-1" } },
    ]);
    const result = await loadMyTopUps([inGrace] as never, "ana", NOW);
    expect(result).toEqual({
      "trip-1": { shareId: "topup-1", amount: 17.5, currency: "USD", deadline: "2026-11-01T12:00:00.000Z" },
    });
    expect(db.paymentShare.findMany).toHaveBeenCalledWith({
      where: {
        userId: "ana",
        payment: { tripRequestId: { in: ["trip-1"] } },
        OR: [
          { kind: "TOP_UP", status: { in: ["PENDING", "FAILED", "CANCELLED", "REJECTED"] } },
          { kind: "ORGANIZER_REMAINDER", status: { not: "APPROVED" } },
        ],
      },
      select: { id: true, kind: true, amount: true, currency: true, payment: { select: { tripRequestId: true } } },
    });
  });

  it("drops a top-up once its grace period ended", async () => {
    db.paymentShare.findMany.mockResolvedValue([
      { id: "topup-1", kind: "TOP_UP", amount: 17.5, currency: "USD", payment: { tripRequestId: "trip-1" } },
    ]);
    const ended = { ...inGrace, topUpDeadline: null };
    expect(await loadMyTopUps([ended] as never, "ana", NOW)).toEqual({});
  });

  it("returns the organizer's remainder with no deadline, replacing any top-up", async () => {
    db.paymentShare.findMany.mockResolvedValue([
      { id: "remainder-1", kind: "ORGANIZER_REMAINDER", amount: 35, currency: "USD", payment: { tripRequestId: "trip-1" } },
      { id: "topup-1", kind: "TOP_UP", amount: 17.5, currency: "USD", payment: { tripRequestId: "trip-1" } },
    ]);
    expect(await loadMyTopUps([{ ...inGrace, topUpDeadline: null }] as never, "organizer", NOW)).toEqual({
      "trip-1": { shareId: "remainder-1", amount: 35, currency: "USD", deadline: null },
    });
  });

  it.each([
    ["a trip paid in total", { ...inGrace, paymentMode: "TOTAL" }],
    ["a trip still collecting", { ...inGrace, status: "COLLECTING" }],
  ])("skips the query for %s", async (_label, trip) => {
    expect(await loadMyTopUps([trip] as never, "ana", NOW)).toEqual({});
    expect(db.paymentShare.findMany).not.toHaveBeenCalled();
  });
});
