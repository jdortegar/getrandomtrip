import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripRequest: { findMany: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn() },
  },
}));
vi.mock("@/lib/email/sendTravelerDetailsReminder", () => ({
  sendTravelerDetailsReminder: vi.fn(),
}));
import { prisma } from "@/lib/prisma";
import { sendTravelerDetailsReminder } from "@/lib/email/sendTravelerDetailsReminder";
import { runBuyerReminder } from "../buyerReminder";

// Departure Sat 2026-10-03 00:00 ART = 03:00Z; the 72h boundary is Wed 2026-09-30 03:00Z.
const now = new Date("2026-09-30T03:00:00Z");
const startDate = new Date("2026-10-03T00:00:00Z");
function trip() {
  return {
    id: "trip",
    type: "xsed",
    status: "CONFIRMED",
    startDate,
    departureTimeZone: "America/Argentina/Buenos_Aires" as string | null,
    payment: { status: "APPROVED" },
    paxDetails: { adults: 2 },
    user: { email: "buyer@example.com", locale: "en" },
    travelers: [
      {
        kind: "ADULT",
        status: "PENDING",
        fullName: null as string | null,
        email: null as string | null,
        idDocument: null as string | null,
        dateOfBirth: null,
      },
    ],
    travelerDetailsReminderSentAt: null as Date | null,
    travelerDetailsReminderClaimedAt: null as Date | null,
  };
}
let record: ReturnType<typeof trip>;
beforeEach(() => {
  vi.resetAllMocks();
  record = trip();
  vi.mocked(sendTravelerDetailsReminder).mockResolvedValue();
  (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockImplementation(
    async ({ where }: any) => {
      expect(where).toMatchObject({
        type: { equals: "xsed", mode: "insensitive" },
        payment: { is: { status: "APPROVED" } },
        status: { notIn: ["CANCELLED", "COMPLETED"] },
        travelerDetailsReminderSentAt: null,
      });
      return record.type === "xsed" &&
        record.payment.status === "APPROVED" &&
        !where.status.notIn.includes(record.status) &&
        !record.travelerDetailsReminderSentAt &&
        record.startDate > where.startDate.gt &&
        record.startDate <= where.startDate.lte
        ? [record]
        : [];
    },
  );
  (prisma.tripRequest.findFirst as ReturnType<typeof vi.fn>).mockImplementation(
    async () => record as never,
  );
  (
    prisma.tripRequest.updateMany as ReturnType<typeof vi.fn>
  ).mockImplementation(async ({ where, data }: any) => {
    if (where.OR) {
      if (
        record.travelerDetailsReminderSentAt ||
        (record.travelerDetailsReminderClaimedAt &&
          record.travelerDetailsReminderClaimedAt >
            where.OR[1].travelerDetailsReminderClaimedAt.lte)
      )
        return { count: 0 };
    } else if (
      record.travelerDetailsReminderClaimedAt?.getTime() !==
      where.travelerDetailsReminderClaimedAt.getTime()
    )
      return { count: 0 };
    Object.assign(record, data);
    return { count: 1 };
  });
});

describe("automatic XSED buyer reminder", () => {
  it("does not send before 72h; sends at the boundary for an uninvited row to its buyer only", async () => {
    expect(await runBuyerReminder(new Date(now.getTime() - 1))).toEqual({
      reminded: 0,
      failed: 0,
    });
    expect(sendTravelerDetailsReminder).not.toHaveBeenCalled();
    expect(await runBuyerReminder(now)).toEqual({ reminded: 1, failed: 0 });
    expect(sendTravelerDetailsReminder).toHaveBeenCalledExactlyOnceWith({
      tripId: "trip",
      buyer: record.user,
    });
    expect(record.travelerDetailsReminderSentAt).toEqual(now);
    expect(await runBuyerReminder(now)).toEqual({ reminded: 0, failed: 0 });
    expect(sendTravelerDetailsReminder).toHaveBeenCalledTimes(1);
  });
  it("measures 72h from local-midnight departure in the trip's own zone", async () => {
    record.departureTimeZone = "Europe/Madrid"; // departure 2026-10-02T22:00Z, boundary 2026-09-29T22:00Z
    expect(await runBuyerReminder(new Date("2026-09-29T21:59:59.999Z"))).toEqual({ reminded: 0, failed: 0 });
    expect(await runBuyerReminder(new Date("2026-09-29T22:00:00Z"))).toEqual({ reminded: 1, failed: 0 });
  });
  it("widens the candidate query conservatively so zones east and west of UTC are not missed", async () => {
    await runBuyerReminder(now);
    const { where } = vi.mocked(prisma.tripRequest.findMany).mock.calls[0][0] as any;
    expect(where.startDate.gt.getTime()).toBeLessThanOrEqual(now.getTime() - 12 * 3_600_000);
    expect(where.startDate.lte.getTime()).toBeGreaterThanOrEqual(now.getTime() + 72 * 3_600_000 + 14 * 3_600_000);
  });
  it("catches up after a missed hourly run but before departure", async () => {
    expect(
      (await runBuyerReminder(new Date(now.getTime() + 5 * 3_600_000)))
        .reminded,
    ).toBe(1);
  });
  it.each([
    "cancelled",
    "completed",
    "unpaid",
    "other-product",
    "departed",
    "complete-roster",
    "solo",
  ])("skips %s", async (scenario) => {
    if (scenario === "cancelled") record.status = "CANCELLED";
    if (scenario === "completed") record.status = "COMPLETED";
    if (scenario === "unpaid") record.payment.status = "PENDING";
    if (scenario === "other-product") record.type = "family";
    if (scenario === "departed") record.startDate = now;
    if (scenario === "complete-roster")
      Object.assign(record.travelers[0], {
        fullName: "Name",
        email: "a@example.com",
        idDocument: "ID",
      });
    if (scenario === "solo") {
      record.paxDetails.adults = 1;
      record.travelers = [];
    }
    expect(await runBuyerReminder(now)).toEqual({ reminded: 0, failed: 0 });
    expect(sendTravelerDetailsReminder).not.toHaveBeenCalled();
  });
  it("includes a missing lazy roster and whitespace-only fields", async () => {
    record.travelers = [];
    expect((await runBuyerReminder(now)).reminded).toBe(1);
    record = trip();
    Object.assign(record.travelers[0], {
      status: "COMPLETE",
      fullName: "Name",
      email: "a@example.com",
      idDocument: " ",
    });
    expect((await runBuyerReminder(now)).reminded).toBe(1);
  });
  it("keeps failed sends retryable and stamps only after acceptance", async () => {
    vi.mocked(sendTravelerDetailsReminder).mockRejectedValueOnce(
      new Error("provider down"),
    );
    expect(await runBuyerReminder(now)).toEqual({ reminded: 0, failed: 1 });
    expect(record.travelerDetailsReminderSentAt).toBeNull();
    expect(record.travelerDetailsReminderClaimedAt).toBeNull();
    expect((await runBuyerReminder(now)).reminded).toBe(1);
  });
  it("only sends once during overlapping runs", async () => {
    let resolve!: () => void;
    vi.mocked(sendTravelerDetailsReminder).mockImplementation(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    const first = runBuyerReminder(now);
    await vi.waitFor(() =>
      expect(sendTravelerDetailsReminder).toHaveBeenCalledTimes(1),
    );
    expect(await runBuyerReminder(now)).toEqual({ reminded: 0, failed: 0 });
    resolve();
    await first;
    expect(sendTravelerDetailsReminder).toHaveBeenCalledTimes(1);
  });
  it("recovers a stale lease and guards finalize/release with the exact owned timestamp", async () => {
    record.travelerDetailsReminderClaimedAt = new Date(now.getTime() - 600_001);
    expect((await runBuyerReminder(now)).reminded).toBe(1);
    expect(prisma.tripRequest.updateMany).toHaveBeenLastCalledWith({
      where: {
        id: "trip",
        travelerDetailsReminderSentAt: null,
        travelerDetailsReminderClaimedAt: now,
      },
      data: {
        travelerDetailsReminderSentAt: now,
        travelerDetailsReminderClaimedAt: null,
      },
    });
  });
  it("rechecks completion after claiming instead of emailing stale candidates", async () => {
    (
      prisma.tripRequest.findFirst as ReturnType<typeof vi.fn>
    ).mockImplementation(async () => {
      Object.assign(record.travelers[0], {
        fullName: "Name",
        email: "a@example.com",
        idDocument: "ID",
      });
      return record as never;
    });
    expect((await runBuyerReminder(now)).reminded).toBe(0);
    expect(sendTravelerDetailsReminder).not.toHaveBeenCalled();
    expect(record.travelerDetailsReminderClaimedAt).toBeNull();
  });
});
