import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), findFirst: vi.fn() },
  tripRequest: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("next-auth", () => ({
  getServerSession: async () => ({ user: { email: "buyer@test.com" } }),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/payments/invalidate-checkout", () => ({
  invalidateCheckoutForEdit: vi.fn(),
}));
import { POST } from "../route";
import { invalidateCheckoutForEdit } from "@/lib/payments/invalidate-checkout";
const trip = {
  id: "trip",
  userId: "buyer",
  type: "couple",
  level: "essenza",
  originCountry: "AR",
  originCity: "Origin",
  status: "SAVED",
  startDate: new Date("2026-10-16"),
  endDate: new Date("2026-10-18"),
  nights: 2,
  pax: 2,
  updatedAt: new Date(1),
  payment: null,
};
const request = (body: object) =>
  new NextRequest("http://localhost/api/trip-requests", {
    method: "POST",
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-27T23:59:59Z"));
  vi.resetAllMocks();
  db.user.findUnique.mockResolvedValue({ id: "buyer", roles: ["TRAVELER"] });
  db.tripRequest.create.mockImplementation(async ({ data }) => ({
    id: "new",
    ...data,
  }));
  db.tripRequest.update.mockImplementation(async ({ data }) => ({
    ...trip,
    ...data,
  }));
});
afterEach(() => vi.useRealTimers());

describe.each(["create", "explicit", "family"])(
  "%s date validation",
  (path) => {
    const body = (startDate: unknown) => ({
      ...trip,
      id: path === "explicit" ? "trip" : undefined,
      startDate,
    });
    beforeEach(() =>
      db.tripRequest.findFirst.mockResolvedValue(
        path === "create" ? null : trip,
      ),
    );
    it.each([
      "2026-09-01",
      "2026-10-03",
      "2026-02-30",
      "invalid",
      "2026-10-04T23:00:00Z",
    ])("rejects %s before checkout invalidation or writes", async (start) => {
      const response = await POST(request(body(start)));
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ errorCode: "INVALID_TRIP_DATES" });
      expect(db.tripRequest.create).not.toHaveBeenCalled();
      expect(db.tripRequest.update).not.toHaveBeenCalled();
      expect(invalidateCheckoutForEdit).not.toHaveBeenCalled();
    });
    it("accepts the seventh UTC calendar day", async () => {
      expect((await POST(request(body("2026-10-04")))).status).toBe(
        path === "create" ? 201 : 200,
      );
    });
  },
);
it("preserves an incomplete draft", async () => {
  db.tripRequest.findFirst.mockResolvedValue(null);
  expect(
    (
      await POST(
        request({
          ...trip,
          id: undefined,
          status: "DRAFT",
          startDate: null,
          endDate: null,
        }),
      )
    ).status,
  ).toBe(201);
});
it("canonical XSED Saturday remains bookable six days after Sunday", async () => {
  db.tripRequest.findFirst.mockResolvedValue(null);
  expect(
    (
      await POST(
        request({
          ...trip,
          id: undefined,
          type: "xsed",
          startDate: null,
          endDate: null,
        }),
      )
    ).status,
  ).toBe(201);
  expect(db.tripRequest.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        startDate: new Date("2026-10-03"),
        endDate: new Date("2026-10-04"),
      }),
    }),
  );
});
