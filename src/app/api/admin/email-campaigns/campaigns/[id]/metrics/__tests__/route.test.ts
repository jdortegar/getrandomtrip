// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/email-campaigns/metrics", () => ({
  getCampaignReport: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getCampaignReport } from "@/lib/email-campaigns/metrics";
import { GET } from "../route";

const request = new NextRequest(
  "http://localhost/api/admin/email-campaigns/campaigns/c1/metrics",
);
const props = { params: Promise.resolve({ id: "c1" }) };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "a1" } });
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "a1",
    roles: ["ADMIN"],
  } as never);
});

describe("GET /campaigns/[id]/metrics", () => {
  it("returns 401 without a session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const res = await GET(request, props);

    expect(res.status).toBe(401);
    expect(getCampaignReport).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-admin", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "a1",
      roles: ["CLIENT"],
    } as never);

    const res = await GET(request, props);

    expect(res.status).toBe(403);
    expect(getCampaignReport).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown campaign", async () => {
    vi.mocked(getCampaignReport).mockResolvedValue(null);

    const res = await GET(request, props);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
  });

  it("returns the metrics and recipients", async () => {
    const report = { metrics: { sent: 2 }, recipients: [{ sendId: "s1" }] };
    vi.mocked(getCampaignReport).mockResolvedValue(report as never);

    const res = await GET(request, props);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(report);
    expect(getCampaignReport).toHaveBeenCalledWith("c1");
  });

  it("returns 500 when loading fails", async () => {
    vi.mocked(getCampaignReport).mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const res = await GET(request, props);

    expect(res.status).toBe(500);
  });
});
