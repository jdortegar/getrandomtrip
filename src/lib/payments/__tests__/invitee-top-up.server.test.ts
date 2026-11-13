import { beforeEach, describe, expect, it, vi } from "vitest";
const db = vi.hoisted(() => ({ paymentShare: { count: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
const totals = vi.hoisted(() => vi.fn());
vi.mock("@/lib/payments/trip-totals.server", () => ({ loadTripTotalsAt: totals }));
import { loadInviteeMaxTopUp } from "../invitee-top-up.server";

// USD 1000 per person + USD 70 per-trip add-on
const totalsAt = (pax: number) => ({
  addonsPerPax: 70 / pax, basePerPax: 1000, cancelInsurancePerPax: 0, filtersPerPax: 0,
  totalPerPax: 1000 + 70 / pax, totalTrip: 1000 * pax + 70,
});
const trip = { id: "trip-1", type: "group", level: "essenza", pax: 4, paxDetails: { adults: 4, minors: 0, rooms: 2 } } as never;

describe("loadInviteeMaxTopUp", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    totals.mockResolvedValue(totalsAt);
  });

  it("is a companion's top-up if they end up travelling with only the organizer", async () => {
    db.paymentShare.count.mockResolvedValue(3);
    await expect(loadInviteeMaxTopUp(trip)).resolves.toBe(17.5);
    expect(db.paymentShare.count).toHaveBeenCalledWith({
      where: { payment: { tripRequestId: "trip-1" }, kind: "SHARE", travelerId: { not: null } },
    });
  });

  it("is zero when the trip has no companion shares", async () => {
    db.paymentShare.count.mockResolvedValue(0);
    await expect(loadInviteeMaxTopUp(trip)).resolves.toBe(0);
    expect(totals).not.toHaveBeenCalled();
  });
});
