// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/email-campaigns/promo", () => ({
  lookupPromotionCode: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { lookupPromotionCode } from "@/lib/email-campaigns/promo";
import { GET } from "../route";

const BASE = "http://localhost/api/admin/email-campaigns/promo-lookup";

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "a1" } });
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "a1",
    roles: ["ADMIN"],
  } as never);
});

describe("GET promo-lookup", () => {
  it("returns 401 / 403 before calling Stripe", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);
    expect((await GET(new NextRequest(`${BASE}?code=X`))).status).toBe(401);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "a1",
      roles: ["CLIENT"],
    } as never);
    expect((await GET(new NextRequest(`${BASE}?code=X`))).status).toBe(403);
    expect(lookupPromotionCode).not.toHaveBeenCalled();
  });

  it("returns 400 without a code", async () => {
    const res = await GET(new NextRequest(BASE));
    expect(res.status).toBe(400);
    expect(lookupPromotionCode).not.toHaveBeenCalled();
  });

  it("returns the normalized summary", async () => {
    vi.mocked(lookupPromotionCode).mockResolvedValue({
      id: "promo_1",
      code: "FUNDADOR30",
    } as never);

    const res = await GET(new NextRequest(`${BASE}?code=%20fundador30`));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      promo: { id: "promo_1", code: "FUNDADOR30" },
    });
    expect(lookupPromotionCode).toHaveBeenCalledWith("FUNDADOR30");
  });

  it("returns 404 for an unknown code", async () => {
    vi.mocked(lookupPromotionCode).mockResolvedValue(null);

    const res = await GET(new NextRequest(`${BASE}?code=NOPE`));

    expect(res.status).toBe(404);
  });
});
