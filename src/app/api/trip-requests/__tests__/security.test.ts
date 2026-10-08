import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), findFirst: vi.fn() },
  tripRequest: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next-auth", () => ({
  getServerSession: async () => ({ user: { email: "buyer@test.com" } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/payments/invalidate-checkout", () => ({
  invalidateCheckoutForEdit: vi.fn(),
}));
import { GET, POST } from "../route";
import { invalidateCheckoutForEdit } from "@/lib/payments/invalidate-checkout";

const trip = {
  id: "trip",
  userId: "buyer",
  type: "couple",
  level: "essenza",
  status: "SAVED",
  startDate: new Date("2099-01-01"),
  endDate: new Date("2099-01-04"),
  updatedAt: new Date(1),
  pax: 2,
  payment: null,
  actualDestination: "Secret city",
};
const createBody = {
  type: "couple",
  level: "essenza",
  excuseKey: "escapada-romantica",
  originCity: "Origin",
  originCountry: "Country",
  startDate: "2099-01-01",
  endDate: "2099-01-04",
};
const request = (body?: object) =>
  new NextRequest(
    "http://localhost/api/trip-requests",
    body ? { method: "POST", body: JSON.stringify(body) } : undefined,
  );

beforeEach(() => {
  vi.resetAllMocks();
  db.user.findUnique.mockResolvedValue({ id: "buyer", roles: ["TRAVELER"] });
  db.tripRequest.findFirst.mockResolvedValue(trip);
  db.tripRequest.update.mockImplementation(async ({ data }) => ({
    ...trip,
    ...data,
  }));
  db.tripRequest.create.mockImplementation(async ({ data }) => ({
    id: "new",
    ...data,
  }));
});

describe("buyer booking lifecycle authorization", () => {
  it.each(["CONFIRMED", "REVEALED", "COMPLETED", "CANCELLED"])(
    "rejects %s on creation and update",
    async (status) => {
      for (const body of [
        { ...createBody, status },
        { id: "trip", status },
      ]) {
        const res = await POST(request(body));
        expect(res.status).toBe(403);
        expect(db.tripRequest.update).not.toHaveBeenCalled();
        expect(db.tripRequest.create).not.toHaveBeenCalled();
      }
    },
  );

  it.each([null, "bogus", { set: "REVEALED" }])(
    "rejects malformed status %j",
    async (status) => {
      expect((await POST(request({ id: "trip", status }))).status).toBe(400);
      expect(db.tripRequest.update).not.toHaveBeenCalled();
    },
  );

  it.each(["DRAFT", "SAVED"])(
    "allows %s creation and editable saves",
    async (status) => {
      db.tripRequest.findFirst.mockResolvedValueOnce(null);
      expect((await POST(request({ ...createBody, status }))).status).toBe(201);
      const res = await POST(request({ id: "trip", status }));
      expect(res.status).toBe(200);
      expect((await res.json()).tripRequest.actualDestination).toBeNull();
      expect(db.tripRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            updatedAt: trip.updatedAt,
            status: { in: ["DRAFT", "SAVED", "PENDING_PAYMENT"] },
          }),
        }),
      );
    },
  );

  it("does not let a buyer set PENDING_PAYMENT before checkout creates it", async () => {
    db.tripRequest.findFirst.mockResolvedValue(null);
    expect(
      (await POST(request({ ...createBody, status: "PENDING_PAYMENT" })))
        .status,
    ).toBe(403);
    expect(db.tripRequest.create).not.toHaveBeenCalled();
    db.tripRequest.findFirst.mockResolvedValue(trip);
    expect(
      (await POST(request({ id: "trip", status: "PENDING_PAYMENT" }))).status,
    ).toBe(403);
  });

  it("allows a PENDING_PAYMENT no-op and guards save against payment races", async () => {
    db.tripRequest.findFirst.mockResolvedValue({
      ...trip,
      status: "PENDING_PAYMENT",
    });
    expect(
      (await POST(request({ id: "trip", status: "PENDING_PAYMENT" }))).status,
    ).toBe(200);
    vi.mocked(invalidateCheckoutForEdit).mockRejectedValueOnce(
      Object.assign(new Error("Payment in progress"), { status: 409 }),
    );
    expect((await POST(request({ id: "trip", status: "SAVED" }))).status).toBe(
      409,
    );
  });

  it.each(["CONFIRMED", "REVEALED", "COMPLETED", "CANCELLED"])(
    "does not regress a settled %s trip to SAVED",
    async (status) => {
      db.tripRequest.findFirst.mockResolvedValue({ ...trip, status });
      expect(
        (await POST(request({ id: "trip", status: "SAVED" }))).status,
      ).toBe(409);
      expect(db.tripRequest.update).not.toHaveBeenCalled();
    },
  );

  it("preserves explicit admin lifecycle edits without exposing pre-reveal content on this buyer endpoint", async () => {
    db.user.findUnique.mockResolvedValue({ id: "buyer", roles: ["ADMIN"] });
    const res = await POST(request({ id: "trip", status: "CONFIRMED" }));
    expect(res.status).toBe(200);
    expect((await res.json()).tripRequest.actualDestination).toBeNull();
  });
});

describe("trip request buyer and companion visibility", () => {
  it.each(["buyer", "other-buyer"])(
    "redacts pre-reveal destination and private experience fields for owner=%s",
    async (userId) => {
      db.tripRequest.findMany.mockResolvedValue([
        {
          ...trip,
          userId,
          status: "CONFIRMED",
          experience: {
            id: "experience",
            title: "Mystery trip",
            heroImage: "public.jpg",
            destinationCity: "Secret city",
            itinerary: ["secret itinerary"],
            adminNotes: "private",
            supplierNotes: "private",
          },
        },
      ]);
      const res = await GET(request());
      const item = (await res.json()).tripRequests[0];
      expect(item.actualDestination).toBeNull();
      expect(item.experience).toEqual({
        id: "experience",
        title: "Mystery trip",
        heroImage: "public.jpg",
      });
      expect(item.role).toBe(userId === "buyer" ? "buyer" : "companion");
    },
  );
});
