import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    tripRequest: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    tripTraveler: { createMany: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("@/lib/email/sendTravelerDetailsReminder", () => ({
  sendTravelerDetailsReminder: vi.fn(),
}));
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { sendTravelerDetailsReminder } from "@/lib/email/sendTravelerDetailsReminder";
import { POST } from "../route";
const now = new Date("2026-09-28T23:59:00Z");
const adult = {
  kind: "ADULT",
  fullName: "Test Guest",
  idDocument: "ID",
  email: "guest@example.test",
  dateOfBirth: null,
};
function trip() {
  return {
    id: "trip",
    type: "family",
    status: "CONFIRMED",
    startDate: new Date("2026-10-15T12:00:00Z"),
    pax: 2,
    paxDetails: { adults: 2, minors: 0 },
    payment: { status: "APPROVED" },
    user: { id: "buyer", email: "buyer@example.test", locale: "es" },
    travelers: [{ ...adult, fullName: " " }],
  };
}
const request = () =>
  POST(
    new NextRequest(
      "http://local/api/admin/trip-requests/trip/traveler-reminder",
      {
        method: "POST",
        body: JSON.stringify({
          to: "attacker@example.test",
          subject: "bad",
          idempotencyKey: "bad",
        }),
      },
    ),
    { params: Promise.resolve({ id: "trip" }) },
  );
beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: "admin", roles: ["ADMIN"] },
  } as never);
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "admin",
    roles: ["ADMIN"],
  } as never);
  vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue(trip() as never);
  vi.mocked(sendTravelerDetailsReminder).mockResolvedValue();
});
afterEach(() => vi.useRealTimers());
it.each(["anonymous", "revoked", "deleted"])(
  "blocks %s before reading trip PII",
  async (caller) => {
    if (caller === "anonymous")
      vi.mocked(getServerSession).mockResolvedValue(null);
    else
      vi.mocked(prisma.user.findUnique).mockResolvedValue(
        caller === "deleted"
          ? null
          : ({ id: "admin", roles: ["CLIENT"] } as never),
      );
    expect((await request()).status).toBe(caller === "anonymous" ? 401 : 403);
    expect(prisma.tripRequest.findUnique).not.toHaveBeenCalled();
    expect(sendTravelerDetailsReminder).not.toHaveBeenCalled();
  },
);
it("returns 404 without email for missing trip", async () => {
  vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue(null);
  expect((await request()).status).toBe(404);
  expect(sendTravelerDetailsReminder).not.toHaveBeenCalled();
});
it.each([
  { payment: { status: "PENDING" } },
  { payment: null },
  { startDate: null },
  { startDate: now },
  { startDate: new Date("2026-01-01Z") },
  { status: "CANCELLED" },
  { status: "COMPLETED" },
  { user: { id: "buyer", email: " ", locale: "es" } },
])("does not send for ineligible state %j", async (change) => {
  vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue({
    ...trip(),
    ...change,
  } as never);
  const res = await request();
  expect(res.status).toBe(409);
  expect(await res.json()).toEqual({ status: "not_eligible" });
  expect(sendTravelerDetailsReminder).not.toHaveBeenCalled();
});
it("does not send if companions completed since page load, regardless of buyer fields", async () => {
  vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue({
    ...trip(),
    travelers: [adult],
  } as never);
  const res = await request();
  expect(await res.json()).toEqual({ status: "already_complete" });
  expect(sendTravelerDetailsReminder).not.toHaveBeenCalled();
});
it.each(["xsed", "family", "couple", "group"])(
  "sends generic %s reminder to server buyer with stable daily key, without mutations",
  async (type) => {
    vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue({
      ...trip(),
      type,
      travelers: [],
    } as never);
    const res = await request();
    expect(await res.json()).toEqual({
      status: "accepted",
      nextEligibleAt: "2026-09-29T00:00:00.000Z",
    });
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(sendTravelerDetailsReminder).toHaveBeenCalledExactlyOnceWith({
      tripId: "trip",
      buyer: { email: "buyer@example.test", locale: "es" },
      variant: "MANUAL",
      idempotencyKey: "manual-traveler-details/trip/buyer/2026-09-28",
    });
    const query = vi.mocked(prisma.tripRequest.findUnique).mock.calls[0][0]!;
    expect(query.select).toEqual({
      id: true,
      status: true,
      startDate: true,
      pax: true,
      paxDetails: true,
      payment: { select: { status: true } },
      user: { select: { id: true, email: true, locale: true } },
      travelers: {
        select: {
          kind: true,
          fullName: true,
          email: true,
          idDocument: true,
          dateOfBirth: true,
        },
      },
    });
    expect(prisma.tripRequest.update).not.toHaveBeenCalled();
    expect(prisma.tripRequest.updateMany).not.toHaveBeenCalled();
    expect(prisma.tripTraveler.createMany).not.toHaveBeenCalled();
    expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
  },
);
it("reuses daily key on same-day retries and changes only at UTC midnight", async () => {
  await request();
  await request();
  vi.setSystemTime(new Date("2026-09-29T00:00:00Z"));
  await request();
  const keys = vi
    .mocked(sendTravelerDetailsReminder)
    .mock.calls.map(([p]) => p.idempotencyKey);
  expect(keys).toEqual([
    "manual-traveler-details/trip/buyer/2026-09-28",
    "manual-traveler-details/trip/buyer/2026-09-28",
    "manual-traveler-details/trip/buyer/2026-09-29",
  ]);
});
it("does not acknowledge provider failure; retry keeps same key", async () => {
  vi.mocked(sendTravelerDetailsReminder).mockRejectedValueOnce(
    new Error("provider failed"),
  );
  expect((await request()).status).toBe(503);
  expect((await request()).status).toBe(200);
  expect(vi.mocked(sendTravelerDetailsReminder).mock.calls[0][0]).toEqual(
    vi.mocked(sendTravelerDetailsReminder).mock.calls[1][0],
  );
});

it("does not send when missing legacy slots cannot be created from a typed breakdown", async () => {
  vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue({
    ...trip(),
    paxDetails: {},
    travelers: [],
  } as never);
  const res = await request();
  expect(res.status).toBe(409);
  expect(await res.json()).toEqual({ status: "roster_needs_review" });
  expect(sendTravelerDetailsReminder).not.toHaveBeenCalled();
});
it("allows an existing incomplete companion without typed pax metadata because the buyer editor exposes saved rows", async () => {
  vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue({
    ...trip(),
    paxDetails: {},
  } as never);
  expect((await request()).status).toBe(200);
  expect(sendTravelerDetailsReminder).toHaveBeenCalledTimes(1);
});
it("does not send when typed lazy slots cannot account for missing legacy headcount", async () => {
  vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue({
    ...trip(),
    pax: 4,
    travelers: [adult],
  } as never);
  expect(await (await request()).json()).toEqual({
    status: "roster_needs_review",
  });
  expect(sendTravelerDetailsReminder).not.toHaveBeenCalled();
});
