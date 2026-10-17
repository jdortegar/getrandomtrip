// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/email-campaigns/campaigns", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/email-campaigns/campaigns")>();
  return { ...original, createCampaign: vi.fn(), listCampaigns: vi.fn() };
});
vi.mock("@/lib/email-campaigns/metrics", () => ({
  getCampaignSummaries: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import {
  CampaignError,
  createCampaign,
  listCampaigns,
} from "@/lib/email-campaigns/campaigns";
import { getCampaignSummaries } from "@/lib/email-campaigns/metrics";
import { GET, POST } from "../route";

const BASE = "http://localhost/api/admin/email-campaigns/campaigns";

const valid = {
  name: "Founders",
  subject: "Tu escapada",
  title: "Llegó el momento",
  bodyMarkdown: "Hola",
  locale: "es",
  segmentSources: ["WAITLIST"],
  promoCode: "fundador30",
};

function asAdmin() {
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "a1" } });
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "a1",
    roles: ["ADMIN"],
  } as never);
}

function postRequest(body: unknown): NextRequest {
  return new NextRequest(BASE, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  asAdmin();
});

describe("auth", () => {
  it("returns 401 without a session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
    expect(listCampaigns).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-admin", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "a1",
      roles: ["CLIENT"],
    } as never);

    const res = await POST(postRequest(valid));

    expect(res.status).toBe(403);
    expect(createCampaign).not.toHaveBeenCalled();
  });
});

describe("GET", () => {
  it("returns the campaign list with each campaign's summary", async () => {
    vi.mocked(listCampaigns).mockResolvedValue([
      { id: "c1", name: "Founders" },
      { id: "c2", name: "Friends" },
    ] as never);
    const summary = {
      id: "c1",
      sent: 10,
      uniqueOpens: 6,
      uniqueClicks: 3,
      conversions: 2,
      revenue: 400,
    };
    vi.mocked(getCampaignSummaries).mockResolvedValue([summary]);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      campaigns: [
        { id: "c1", name: "Founders", summary },
        {
          id: "c2",
          name: "Friends",
          summary: {
            id: "c2",
            sent: 0,
            uniqueOpens: 0,
            uniqueClicks: 0,
            conversions: 0,
            revenue: 0,
          },
        },
      ],
    });
  });

  it("returns 500 when summaries fail", async () => {
    vi.mocked(listCampaigns).mockResolvedValue([{ id: "c1" }] as never);
    vi.mocked(getCampaignSummaries).mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const res = await GET();

    expect(res.status).toBe(500);
  });
});

describe("POST", () => {
  it("creates a draft owned by the admin", async () => {
    vi.mocked(createCampaign).mockResolvedValue({ id: "c1" } as never);

    const res = await POST(postRequest(valid));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ campaign: { id: "c1" } });
    expect(createCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: "es",
        promoCode: "FUNDADOR30",
        preheader: null,
        ctaLabel: null,
        ctaUrl: null,
      }),
      "a1",
    );
  });

  it("returns 400 for invalid input", async () => {
    const res = await POST(postRequest({ ...valid, segmentSources: [] }));

    expect(res.status).toBe(400);
    expect(createCampaign).not.toHaveBeenCalled();
  });

  it("returns 400 invalid_promo_code for unknown or inactive codes", async () => {
    vi.mocked(createCampaign).mockRejectedValue(
      new CampaignError("invalid_promo_code"),
    );

    const res = await POST(postRequest(valid));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_promo_code" });
  });
});
