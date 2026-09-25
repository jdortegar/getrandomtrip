import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), findFirst: vi.fn() },
  tripRequest: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
}));
const stripe = vi.hoisted(() => ({
  paymentIntents: { retrieve: vi.fn(), cancel: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/stripe", () => ({ getStripe: () => stripe }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-auth", () => ({
  getServerSession: async () => ({ user: { email: "buyer@test.com" } }),
}));
import { POST } from "../route";

const trip = {
  id: "trip",
  userId: "buyer",
  type: "group",
  level: "essenza",
  pax: 2,
  nights: 3,
  paxDetails: { adults: 2, minors: 0, rooms: 1 },
  status: "PENDING_PAYMENT",
  updatedAt: new Date(1),
  from: "admin",
  originCountry: "Argentina",
  originCity: "Buenos Aires",
  tripperId: null,
  transport: "plane",
  accommodationType: "any",
  climate: "any",
  maxTravelTime: "no-limit",
  departPref: "any",
  arrivePref: "any",
  avoidDestinations: [],
  addons: [],
  payment: { status: "PENDING", stripePaymentIntentId: "pi_old" },
};
const request = (body: object) =>
  new Request("http://localhost/api/trip-requests", {
    method: "POST",
    body: JSON.stringify(body),
  }) as import("next/server").NextRequest;

describe("checkout-sensitive trip edits", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.user.findUnique.mockResolvedValue({ id: "buyer" });
    db.tripRequest.findFirst.mockResolvedValue(trip);
    db.tripRequest.update.mockImplementation(async ({ data }) => ({
      ...trip,
      ...data,
    }));
    stripe.paymentIntents.retrieve.mockResolvedValue({
      id: "pi_old",
      status: "requires_payment_method",
    });
    stripe.paymentIntents.cancel.mockResolvedValue({
      id: "pi_old",
      status: "canceled",
    });
  });

  describe.each(["id", "family"])("%s path", (path) => {
    const body = (change: object) =>
      path === "id"
        ? { id: "trip", ...change }
        : { ...trip, id: undefined, ...change };
    it.each([
      { level: "explora" },
      { climate: "warm" },
      { addons: [{ id: "cancel-ins", qty: 1 }] },
    ])(
      "cancels old intent before same-headcount price edit %j",
      async (change) => {
        const res = await POST(request(body(change)));
        expect(res.status).toBe(200);
        expect(stripe.paymentIntents.cancel).toHaveBeenCalledWith("pi_old");
        expect(
          stripe.paymentIntents.cancel.mock.invocationCallOrder[0],
        ).toBeLessThan(db.tripRequest.update.mock.invocationCallOrder[0]);
        expect(db.tripRequest.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              updatedAt: trip.updatedAt,
              payment: {
                is: {
                  stripePaymentIntentId: "pi_old",
                  status: {
                    in: ["PENDING", "FAILED", "CANCELLED", "REJECTED"],
                  },
                },
              },
            }),
          }),
        );
      },
    );
    it("leaves same-priced unchanged inputs and room edits intact", async () => {
      const res = await POST(
        request(
          body({
            level: "essenza",
            pax: 2,
            paxDetails: { adults: 2, minors: 0, rooms: 2 },
          }),
        ),
      );
      expect(res.status).toBe(200);
      expect(stripe.paymentIntents.cancel).not.toHaveBeenCalled();
    });
    it("rejects price edits if confirmation won before cancellation", async () => {
      stripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_old",
        status: "processing",
      });
      const res = await POST(request(body({ level: "explora" })));
      expect(res.status).toBe(409);
      expect(db.tripRequest.update).not.toHaveBeenCalled();
    });
  });

  it("does not restrict a nonprice status transition on a settled trip", async () => {
    db.tripRequest.findFirst.mockResolvedValue({
      ...trip,
      status: "CONFIRMED",
      payment: { ...trip.payment, status: "APPROVED" },
    });
    expect(
      (
        await POST(
          request({
            id: "trip",
            status: "COMPLETED",
            level: "essenza",
            pax: 2,
            paxDetails: trip.paxDetails,
          }),
        )
      ).status,
    ).toBe(200);
    expect(stripe.paymentIntents.retrieve).not.toHaveBeenCalled();
  });

  it("preserves a payable intent for an unchanged partial price field", async () => {
    expect((await POST(request({ id: "trip", level: "essenza" }))).status).toBe(
      200,
    );
    expect(stripe.paymentIntents.cancel).not.toHaveBeenCalled();
    expect(stripe.paymentIntents.retrieve).not.toHaveBeenCalled();
    expect(db.tripRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ updatedAt: trip.updatedAt }),
      }),
    );
  });

  it("keeps origin-only changes outside payment invalidation", async () => {
    expect(
      (await POST(request({ id: "trip", originCity: "Córdoba" }))).status,
    ).toBe(200);
    expect(stripe.paymentIntents.retrieve).not.toHaveBeenCalled();
  });

  it("rejects an apparently unchanged party after another checkout advances the trip", async () => {
    const current = {
      ...trip,
      pax: 3,
      updatedAt: new Date(2),
      payment: { ...trip.payment, stripePaymentIntentId: "pi_new" },
    };
    db.tripRequest.update.mockImplementation(async ({ where, data }) => {
      if (where.updatedAt && where.updatedAt !== current.updatedAt)
        throw new Prisma.PrismaClientKnownRequestError("Stale trip", {
          code: "P2025",
          clientVersion: "test",
        });
      return Object.assign(current, data);
    });
    const res = await POST(
      request({
        id: "trip",
        pax: 2,
        paxDetails: trip.paxDetails,
        level: "essenza",
      }),
    );
    expect(res.status).toBe(409);
    expect(current).toMatchObject({
      pax: 3,
      payment: { stripePaymentIntentId: "pi_new" },
    });
    expect(stripe.paymentIntents.retrieve).not.toHaveBeenCalled();
  });

  it("canonicalizes party when an explicit Solo level edit omits pax", async () => {
    db.tripRequest.findFirst.mockResolvedValue({
      ...trip,
      type: "xsed",
      level: "group",
    });
    expect((await POST(request({ id: "trip", level: "solo" }))).status).toBe(
      200,
    );
    expect(db.tripRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ pax: 1, level: "solo" }),
      }),
    );
  });

  it.each(["couple", "family", "group"])(
    "normalizes XSED %s to Solo when checkout saves one person",
    async (level) => {
      db.tripRequest.findFirst.mockResolvedValue({
        ...trip,
        type: "xsed",
        level,
      });
      const res = await POST(
        request({
          id: "trip",
          pax: 1,
          paxDetails: { adults: 1, minors: 0, rooms: 1 },
        }),
      );
      expect(res.status).toBe(200);
      expect(db.tripRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ level: "solo", pax: 1 }),
        }),
      );
    },
  );

  it("normalizes a fresh XSED one-person selection instead of persisting Group", async () => {
    db.tripRequest.findFirst.mockResolvedValue(null);
    db.tripRequest.create.mockResolvedValue({ id: "new", type: "xsed" });
    expect(
      (
        await POST(
          request({
            ...trip,
            id: undefined,
            type: "xsed",
            level: "group",
            pax: 1,
            paxDetails: undefined,
          }),
        )
      ).status,
    ).toBe(201);
    expect(db.tripRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ level: "solo", pax: 1 }),
      }),
    );
  });
});
