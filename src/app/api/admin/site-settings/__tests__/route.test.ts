import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET, PATCH } from "../route";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    siteSetting: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));
const settings = {
  id: "global",
  gateEnabled: false,
  xsedWindowEnforcementEnabled: true,
  xsedCampaignStartDate: new Date("2026-09-27T00:00:00Z"),
  updatedAt: new Date(),
};
function request(body: unknown) {
  return new NextRequest("http://localhost/api/admin/site-settings", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "admin" } });
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "admin",
    roles: ["ADMIN"],
  } as never);
  vi.mocked(prisma.siteSetting.findUnique).mockResolvedValue(settings);
  vi.mocked(prisma.siteSetting.upsert).mockResolvedValue(settings);
});

describe("admin campaign settings", () => {
  it.each([GET, () => PATCH(request({ xsedCampaignStartDate: "2026-10-04" }))])(
    "requires authentication and current database admin role",
    async (call) => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      expect((await call()).status).toBe(401);
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: "admin", roles: ["ADMIN"] },
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "admin",
        roles: ["TRIPPER"],
      } as never);
      expect((await call()).status).toBe(403);
      expect(prisma.siteSetting.upsert).not.toHaveBeenCalled();
      expect(prisma.siteSetting.findUnique).not.toHaveBeenCalled();
    },
  );

  it("GET serializes a date-only value alongside unchanged flags", async () => {
    expect(await (await GET()).json()).toEqual({
      gateEnabled: false,
      xsedWindowEnforcementEnabled: true,
      xsedCampaignStartDate: "2026-09-27",
    });
  });

  it("PATCH updates only the date, without resetting flags", async () => {
    const date = new Date("2026-10-04T00:00:00Z");
    vi.mocked(prisma.siteSetting.upsert).mockResolvedValue({
      ...settings,
      xsedCampaignStartDate: date,
    });
    const response = await PATCH(
      request({ xsedCampaignStartDate: "2026-10-04" }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      xsedCampaignStartDate: "2026-10-04",
      gateEnabled: false,
    });
    expect(prisma.siteSetting.upsert).toHaveBeenCalledWith({
      where: { id: "global" },
      update: { xsedCampaignStartDate: date },
      create: { id: "global", xsedCampaignStartDate: date },
    });
  });

  it("flag-only PATCH leaves the date untouched", async () => {
    expect((await PATCH(request({ gateEnabled: true }))).status).toBe(200);
    expect(prisma.siteSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { gateEnabled: true } }),
    );
  });

  it.each([null, 20260927, "", "2026-02-30", "2026-09-27T00:00:00Z"])(
    "rejects invalid date %s before applying even valid sibling flags",
    async (date) => {
      expect(
        (
          await PATCH(
            request({ gateEnabled: true, xsedCampaignStartDate: date }),
          )
        ).status,
      ).toBe(400);
      expect(prisma.siteSetting.upsert).not.toHaveBeenCalled();
    },
  );
});
