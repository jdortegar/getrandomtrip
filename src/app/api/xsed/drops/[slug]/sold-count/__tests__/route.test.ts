import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET } from "../route";

vi.mock("@/lib/prisma", () => ({
  prisma: { experience: { findUnique: vi.fn() } },
}));
const request = (query = "country=MX") =>
  new Request(`http://localhost/api/xsed/drops/23/sold-count?${query}`);
const context = { params: Promise.resolve({ slug: "23" }) };
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-28T00:00:00Z"));
  vi.mocked(prisma.experience.findUnique).mockResolvedValue({
    maxSpots: 10,
    tripRequests: [
      { originCountry: "Argentina" },
      { originCountry: "MX" },
      { originCountry: "México" },
    ],
  } as never);
});
afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe("country-scoped sold-count API", () => {
  it.each([
    "",
    "country=",
    "country=ZZ",
    "country=US",
    "country=constructor",
    "country=__proto__",
    "country=Argentina",
  ])(
    "rejects missing or invalid country in %s before DB access",
    async (query) => {
      expect((await GET(request(query), context)).status).toBe(400);
      expect(prisma.experience.findUnique).not.toHaveBeenCalled();
    },
  );

  it("returns only the requested country's count without cross-request caching", async () => {
    const response = await GET(request(), context);
    expect(await response.json()).toEqual({
      country: "MX",
      displayedSold: 2,
      isSoldOut: false,
      totalSlots: 10,
    });
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(prisma.experience.findUnique).toHaveBeenCalledWith({
      where: { slug: "23" },
      select: {
        maxSpots: true,
        tripRequests: {
          where: {
            status: {
              in: ["PENDING_PAYMENT", "CONFIRMED", "REVEALED", "COMPLETED"],
            },
          },
          select: { originCountry: true },
        },
      },
    });
  });

  it("accepts lowercase ISO and keeps default capacity", async () => {
    vi.mocked(prisma.experience.findUnique).mockResolvedValue({
      maxSpots: null,
      tripRequests: [],
    } as never);
    expect(await (await GET(request("country=mx"), context)).json()).toEqual({
      country: "MX",
      displayedSold: 0,
      isSoldOut: false,
      totalSlots: 10,
    });
  });

  it("caps the sum of country real and automatic counts", async () => {
    vi.setSystemTime(new Date("2026-09-28T03:00:00Z"));
    expect(await (await GET(request(), context)).json()).toMatchObject({
      displayedSold: 10,
      isSoldOut: true,
    });
  });

  it("returns 404 for a missing drop", async () => {
    vi.mocked(prisma.experience.findUnique).mockResolvedValue(null);
    expect((await GET(request(), context)).status).toBe(404);
  });
});
