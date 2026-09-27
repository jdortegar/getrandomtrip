import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    experience: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { GET } from "../route";
import { prisma } from "@/lib/prisma";

const findManyMock = prisma.experience.findMany as ReturnType<typeof vi.fn>;

function makeRequest(query: string) {
  return new NextRequest(`http://localhost/api/experiences${query}`);
}

describe("GET /api/experiences — matching exclusion (owner.isActive)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue([]);
  });

  it("returns 400 when tripperId/ownerId is missing", async () => {
    const res = await GET(makeRequest(""));
    expect(res.status).toBe(400);
  });

  it("includes owner: { isActive: true } in the where clause alongside Experience.isActive", async () => {
    await GET(makeRequest("?tripperId=tripper-1"));

    const args = findManyMock.mock.calls[0][0];
    expect(args.where).toMatchObject({
      ownerId: "tripper-1",
      isActive: true,
      owner: { isActive: true },
    });
  });
});


it("public listing selects only published originals and an explicit public field allowlist", async () => {
  await GET(makeRequest("?tripperId=tripper-1&type=couple&level=essenza"));
  const args = findManyMock.mock.calls.at(-1)![0];
  expect(args.where).toMatchObject({ status: "ACTIVE", isReviewCopy: false, type: { has: "couple" } });
  expect(args.include).toBeUndefined();
  expect(args.select).toMatchObject({ id: true, title: true, heroImage: true });
  for (const key of ["adminNotes", "supplierNotes", "destinationCity", "destinationCountry", "itinerary", "hotels", "activities", "revealCopy", "reviewNote", "tripperNote", "titleInternal", "sections"]) {
    expect(args.select).not.toHaveProperty(key);
  }
});
