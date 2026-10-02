import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), findFirst: vi.fn() },
    tripRequest: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    experience: { findUnique: vi.fn() },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { POST } from "../route";

const body = {
  type: "couple",
  level: "essenza",
  originCountry: "Argentina",
  originCity: "Buenos Aires",
  pax: 2,
  nights: 3,
  startDate: "2099-01-01",
  endDate: "2099-01-04",
};

function post(extra: Record<string, unknown>) {
  return POST(
    new Request("http://localhost/api/trip-requests", {
      method: "POST",
      body: JSON.stringify({ ...body, ...extra }),
    }) as unknown as import("next/server").NextRequest,
  );
}

function createdData() {
  return vi.mocked(prisma.tripRequest.create).mock.calls[0][0].data;
}

describe("POST /api/trip-requests — departureTimeZone", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(getServerSession).mockResolvedValue({ user: { email: "a@b.c" } });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.c" } as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.tripRequest.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.tripRequest.create).mockResolvedValue({ id: "t1", type: "couple" } as never);
  });

  it("stores the origin country zone when the client sends originCountryCode", async () => {
    await post({ originCountryCode: "MX", browserTimeZone: "Europe/Madrid" });
    expect(createdData()).toMatchObject({ departureTimeZone: "America/Mexico_City" });
  });

  it("falls back to a valid browser zone for countries without a mapped zone", async () => {
    await post({ originCountryCode: "ES", browserTimeZone: "Europe/Madrid" });
    expect(createdData()).toMatchObject({ departureTimeZone: "Europe/Madrid" });
  });

  it("ignores an invalid browser zone", async () => {
    await post({ browserTimeZone: "Nope/Nada" });
    expect(createdData()).toMatchObject({ departureTimeZone: "America/Argentina/Buenos_Aires" });
  });

  it("still books when a legacy client omits both fields", async () => {
    const res = await post({});
    expect(res.status).toBe(201);
    expect(createdData()).toMatchObject({ departureTimeZone: "America/Argentina/Buenos_Aires" });
  });

  it("does not overwrite the stored zone when a reused active trip arrives without zone inputs", async () => {
    vi.mocked(prisma.tripRequest.findFirst).mockResolvedValue({
      id: "active", status: "SAVED", startDate: new Date("2099-01-01"), endDate: new Date("2099-01-04"), tripperId: null,
    } as never);
    vi.mocked(prisma.tripRequest.update).mockResolvedValue({ id: "active", type: "couple" } as never);
    await post({});
    const data = vi.mocked(prisma.tripRequest.update).mock.calls[0][0].data;
    expect(data).not.toHaveProperty("departureTimeZone");
  });

  it("updates the zone on a reused active trip when the client sends zone inputs", async () => {
    vi.mocked(prisma.tripRequest.findFirst).mockResolvedValue({
      id: "active", status: "SAVED", startDate: new Date("2099-01-01"), endDate: new Date("2099-01-04"), tripperId: null,
    } as never);
    vi.mocked(prisma.tripRequest.update).mockResolvedValue({ id: "active", type: "couple" } as never);
    await post({ originCountryCode: "CL" });
    expect(vi.mocked(prisma.tripRequest.update).mock.calls[0][0].data).toMatchObject({
      departureTimeZone: "America/Santiago",
    });
  });
});
