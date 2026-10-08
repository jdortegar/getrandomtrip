import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), findFirst: vi.fn() },
  tripRequest: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
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
import { POST } from "../route";

const base = {
  type: "solo",
  level: "essenza",
  originCity: "Origin",
  originCountry: "Country",
  startDate: "2099-01-01",
  endDate: "2099-01-04",
};
const owned = {
  id: "trip",
  userId: "buyer",
  type: "solo",
  level: "essenza",
  status: "DRAFT",
  excuseKey: null,
  refineDetails: [],
  startDate: new Date("2099-01-01"),
  endDate: new Date("2099-01-04"),
  updatedAt: new Date(1),
  pax: 1,
  payment: null,
};
const request = (body: object) =>
  new NextRequest("http://localhost/api/trip-requests", {
    method: "POST",
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.resetAllMocks();
  db.user.findUnique.mockResolvedValue({ id: "buyer", roles: ["TRAVELER"] });
  db.tripRequest.findFirst.mockResolvedValue(null);
  db.tripRequest.create.mockImplementation(async ({ data }) => ({
    id: "new",
    ...data,
  }));
  db.tripRequest.update.mockImplementation(async ({ data }) => ({
    ...owned,
    ...data,
  }));
});

describe("POST /api/trip-requests excuse selection", () => {
  it("persists a sanitized excuse and refine details on create", async () => {
    const res = await POST(
      request({
        ...base,
        status: "SAVED",
        excuseKey: "solo-get-lost",
        refineDetails: ["sl-gl-naturaleza-silenciosa", "bogus", "sl-gl-naturaleza-silenciosa"],
      }),
    );
    expect(res.status).toBe(201);
    expect(db.tripRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          excuseKey: "solo-get-lost",
          refineDetails: ["sl-gl-naturaleza-silenciosa"],
        }),
      }),
    );
  });

  it("rejects an excuse from another traveler type", async () => {
    const res = await POST(
      request({ ...base, status: "SAVED", excuseKey: "family-adventure" }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ errorCode: "INVALID_EXCUSE" });
    expect(db.tripRequest.create).not.toHaveBeenCalled();
  });

  it("requires an excuse once the trip leaves DRAFT", async () => {
    const res = await POST(request({ ...base, status: "SAVED" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ errorCode: "EXCUSE_REQUIRED" });
  });

  it("lets a DRAFT be saved without an excuse", async () => {
    const res = await POST(request({ ...base, status: "DRAFT" }));
    expect(res.status).toBe(201);
    expect(db.tripRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ excuseKey: null, refineDetails: [] }),
      }),
    );
  });

  it("drops the excuse silently where the step does not apply", async () => {
    const res = await POST(
      request({
        ...base,
        type: "honeymoon",
        status: "SAVED",
        excuseKey: "honeymoon-luxury",
        refineDetails: ["x"],
      }),
    );
    expect(res.status).toBe(201);
    expect(db.tripRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ excuseKey: null, refineDetails: [] }),
      }),
    );
  });

  it("validates an xsed excuse against the traveler type stored in level", async () => {
    const ok = await POST(
      request({
        ...base,
        type: "xsed",
        level: "family",
        pax: 3,
        status: "SAVED",
        excuseKey: "family-adventure",
      }),
    );
    expect(ok.status).toBe(201);
    const bad = await POST(
      request({
        ...base,
        type: "xsed",
        level: "family",
        pax: 3,
        status: "SAVED",
        excuseKey: "solo-get-lost",
      }),
    );
    expect(bad.status).toBe(400);
  });

  it("persists the excuse on an owned partial update", async () => {
    db.tripRequest.findFirst.mockResolvedValue(owned);
    const res = await POST(
      request({ id: "trip", excuseKey: "solo-get-lost", refineDetails: [] }),
    );
    expect(res.status).toBe(200);
    expect(db.tripRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          excuseKey: "solo-get-lost",
          refineDetails: [],
        }),
      }),
    );
  });

  it("rejects an invalid excuse on an owned update", async () => {
    db.tripRequest.findFirst.mockResolvedValue(owned);
    const res = await POST(request({ id: "trip", excuseKey: "nope" }));
    expect(res.status).toBe(400);
    expect(db.tripRequest.update).not.toHaveBeenCalled();
  });

  it("clears a stored excuse that no longer fits a changed traveler type", async () => {
    db.tripRequest.findFirst.mockResolvedValue({
      ...owned,
      excuseKey: "solo-get-lost",
    });
    const res = await POST(request({ id: "trip", type: "family", level: "essenza" }));
    expect(res.status).toBe(200);
    expect(db.tripRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ excuseKey: null, refineDetails: [] }),
      }),
    );
  });
});
