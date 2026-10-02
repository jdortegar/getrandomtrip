import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripRequest: { findMany: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn() },
    tripTraveler: { updateMany: vi.fn() },
    user: { findMany: vi.fn() },
    notification: { createMany: vi.fn() },
  },
}));
vi.mock("@/lib/email", () => ({ deliverDestinationRevealedEmail: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { deliverDestinationRevealedEmail } from "@/lib/email";
import { notifyRevealedTrip, runRevealNotifications } from "../revealNotifications";

// Sat 2026-10-03 from Argentina: departs 2026-10-03T03:00Z; reveal Thu 2026-10-01 09:00 ART.
const now = new Date("2026-10-01T13:00:00Z");
const BA = "America/Argentina/Buenos_Aires";

function revealedTrip(overrides: Record<string, unknown> = {}) {
  return {
    id: "trip",
    userId: "buyer",
    startDate: new Date("2026-10-03T00:00:00Z"),
    departureTimeZone: BA,
    revealNotifiedAt: null as Date | null,
    travelers: [{ id: "trav-1", userId: "companion", revealNotifiedAt: null as Date | null }],
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(prisma.tripRequest.findMany).mockResolvedValue([revealedTrip()] as never);
  vi.mocked(prisma.user.findMany).mockResolvedValue([
    { id: "buyer", locale: "es" },
    { id: "companion", locale: "en" },
  ] as never);
  vi.mocked(prisma.tripRequest.updateMany).mockResolvedValue({ count: 1 });
  vi.mocked(prisma.tripTraveler.updateMany).mockResolvedValue({ count: 1 });
  vi.mocked(prisma.notification.createMany).mockResolvedValue({ count: 1 });
  vi.mocked(deliverDestinationRevealedEmail).mockResolvedValue("sent");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("notifyRevealedTrip (admin manual reveal)", () => {
  it("loads one REVEALED trip by id and notifies its pending recipients", async () => {
    vi.mocked(prisma.tripRequest.findFirst).mockResolvedValue(revealedTrip() as never);
    const result = await notifyRevealedTrip("trip", now);
    expect(prisma.tripRequest.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "trip", status: "REVEALED" } }),
    );
    expect(result).toEqual({ notified: 2, failed: 0 });
  });

  it("does nothing when the trip is not (or no longer) REVEALED", async () => {
    vi.mocked(prisma.tripRequest.findFirst).mockResolvedValue(null);
    expect(await notifyRevealedTrip("trip", now)).toEqual({ notified: 0, failed: 0 });
    expect(deliverDestinationRevealedEmail).not.toHaveBeenCalled();
  });
});

describe("runRevealNotifications", () => {
  it("selects REVEALED trips with an unstamped buyer or an unstamped joined companion, widened for zones", async () => {
    await runRevealNotifications(now);
    const { where } = vi.mocked(prisma.tripRequest.findMany).mock.calls[0][0] as any;
    expect(where.status).toBe("REVEALED");
    expect(where.startDate.gt.getTime()).toBeLessThanOrEqual(now.getTime() - 12 * 3_600_000);
    expect(where.OR).toEqual([
      { revealNotifiedAt: null },
      { travelers: { some: { userId: { not: null }, revealNotifiedAt: null } } },
    ]);
  });

  it("emails the buyer and each joined companion once, each in their own run, and stamps them independently", async () => {
    const result = await runRevealNotifications(now);

    expect(deliverDestinationRevealedEmail).toHaveBeenCalledTimes(2);
    expect(deliverDestinationRevealedEmail).toHaveBeenCalledWith("trip", "buyer");
    expect(deliverDestinationRevealedEmail).toHaveBeenCalledWith("trip", "companion");
    expect(prisma.tripRequest.updateMany).toHaveBeenCalledWith({
      where: { id: "trip", revealNotifiedAt: null },
      data: { revealNotifiedAt: now },
    });
    expect(prisma.tripTraveler.updateMany).toHaveBeenCalledWith({
      where: { id: "trav-1", revealNotifiedAt: null },
      data: { revealNotifiedAt: now },
    });
    expect(result).toEqual({ notified: 2, failed: 0 });
  });

  it("creates one BOOKING_REVEALED in-app notification per recipient in their locale, linking to the trip, with a deterministic id", async () => {
    await runRevealNotifications(now);
    const rows = vi.mocked(prisma.notification.createMany).mock.calls.flatMap((call) => (call[0] as any).data);
    expect(rows).toHaveLength(2);
    expect(rows.find((row: any) => row.userId === "buyer")).toMatchObject({
      id: "booking-revealed:trip:buyer",
      type: "BOOKING_REVEALED",
      audience: "TRAVELER",
      title: "Tu destino ya está listo",
      metadata: { tripRequestId: "trip" },
    });
    expect(rows.find((row: any) => row.userId === "companion")).toMatchObject({
      id: "booking-revealed:trip:companion",
      title: "Your destination is ready",
    });
    for (const call of vi.mocked(prisma.notification.createMany).mock.calls) {
      expect((call[0] as any).skipDuplicates).toBe(true);
    }
  });

  it("leaves a failed buyer email unstamped (retried next run) while the companion is still served", async () => {
    vi.mocked(deliverDestinationRevealedEmail).mockImplementation(async (_trip, userId) => {
      if (userId === "buyer") throw new Error("resend down");
      return "sent";
    });

    const result = await runRevealNotifications(now);

    expect(prisma.tripRequest.updateMany).not.toHaveBeenCalled();
    expect(prisma.tripTraveler.updateMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ notified: 1, failed: 1 });
  });

  it("never resends to a stamped buyer when only a companion is still pending", async () => {
    vi.mocked(prisma.tripRequest.findMany).mockResolvedValue([
      revealedTrip({ revealNotifiedAt: new Date("2026-10-01T12:00:00Z") }),
    ] as never);

    await runRevealNotifications(now);

    expect(deliverDestinationRevealedEmail).toHaveBeenCalledExactlyOnceWith("trip", "companion");
    expect(prisma.tripRequest.updateMany).not.toHaveBeenCalled();
  });

  it("never resends to a stamped companion when only the buyer is still pending", async () => {
    vi.mocked(prisma.tripRequest.findMany).mockResolvedValue([
      revealedTrip({ travelers: [{ id: "trav-1", userId: "companion", revealNotifiedAt: new Date("2026-10-01T12:00:00Z") }] }),
    ] as never);

    await runRevealNotifications(now);

    expect(deliverDestinationRevealedEmail).toHaveBeenCalledExactlyOnceWith("trip", "buyer");
    expect(prisma.tripTraveler.updateMany).not.toHaveBeenCalled();
  });

  it("does not retry once the trip has departed", async () => {
    vi.mocked(prisma.tripRequest.findMany).mockResolvedValue([
      revealedTrip({ startDate: new Date("2026-10-01T00:00:00Z") }), // departed 2026-10-01T03:00Z
    ] as never);

    const result = await runRevealNotifications(now);

    expect(deliverDestinationRevealedEmail).not.toHaveBeenCalled();
    expect(result).toEqual({ notified: 0, failed: 0 });
  });

  it("uses the trip's own zone to decide departure (Madrid trip departs before the same UTC-midnight Buenos Aires trip)", async () => {
    vi.mocked(prisma.tripRequest.findMany).mockResolvedValue([
      revealedTrip({ startDate: new Date("2026-10-02T00:00:00Z"), departureTimeZone: "Asia/Tokyo" }), // departed 2026-10-01T15:00Z
    ] as never);
    const late = new Date("2026-10-01T16:00:00Z");

    await runRevealNotifications(late);

    expect(deliverDestinationRevealedEmail).not.toHaveBeenCalled();
  });

  it("stamps a recipient with no email so it is not retried forever", async () => {
    vi.mocked(deliverDestinationRevealedEmail).mockResolvedValue("skipped");
    await runRevealNotifications(now);
    expect(prisma.tripRequest.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.tripTraveler.updateMany).toHaveBeenCalledTimes(1);
  });

  it("still emails when the in-app notification cannot be created", async () => {
    vi.mocked(prisma.notification.createMany).mockRejectedValue(new Error("db"));
    const result = await runRevealNotifications(now);
    expect(deliverDestinationRevealedEmail).toHaveBeenCalledTimes(2);
    expect(result.notified).toBe(2);
  });

  it("does not count a recipient whose stamp write failed after a successful send as failed-and-resent in the same run", async () => {
    vi.mocked(prisma.tripRequest.updateMany).mockRejectedValue(new Error("db"));
    const result = await runRevealNotifications(now);
    expect(deliverDestinationRevealedEmail).toHaveBeenCalledTimes(2); // one attempt each, no in-run retry
    expect(result.failed).toBe(1);
  });

  it("deduplicates a companion who is also the buyer", async () => {
    vi.mocked(prisma.tripRequest.findMany).mockResolvedValue([
      revealedTrip({ travelers: [{ id: "trav-1", userId: "buyer", revealNotifiedAt: null }] }),
    ] as never);
    await runRevealNotifications(now);
    expect(deliverDestinationRevealedEmail).toHaveBeenCalledExactlyOnceWith("trip", "buyer");
  });
});
