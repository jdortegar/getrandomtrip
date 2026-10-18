// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/email-campaigns/sending", () => ({
  getCampaignAudienceCount: vi.fn(),
  sendCampaign: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { CampaignError } from "@/lib/email-campaigns/campaigns";
import {
  getCampaignAudienceCount,
  sendCampaign,
} from "@/lib/email-campaigns/sending";
import { POST as SEND } from "../route";
import { GET as AUDIENCE } from "../../audience/route";

const BASE = "http://localhost/api/admin/email-campaigns/campaigns/c1";
const props = { params: Promise.resolve({ id: "c1" }) };
const sendRequest = () => new NextRequest(`${BASE}/send`, { method: "POST" });
const audienceRequest = () => new NextRequest(`${BASE}/audience`);

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "a1" } });
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "a1",
    roles: ["ADMIN"],
  } as never);
});

describe("auth", () => {
  it("returns 401 without a session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const responses = await Promise.all([
      SEND(sendRequest(), props),
      AUDIENCE(audienceRequest(), props),
    ]);

    expect(responses.map((res) => res.status)).toEqual([401, 401]);
    expect(sendCampaign).not.toHaveBeenCalled();
    expect(getCampaignAudienceCount).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-admin", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "a1",
      roles: ["CLIENT"],
    } as never);

    const responses = await Promise.all([
      SEND(sendRequest(), props),
      AUDIENCE(audienceRequest(), props),
    ]);

    expect(responses.map((res) => res.status)).toEqual([403, 403]);
    expect(sendCampaign).not.toHaveBeenCalled();
  });
});

describe("GET audience", () => {
  it("returns the recipient count", async () => {
    vi.mocked(getCampaignAudienceCount).mockResolvedValue(42);

    const res = await AUDIENCE(audienceRequest(), props);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ count: 42 });
    expect(getCampaignAudienceCount).toHaveBeenCalledWith("c1");
  });

  it("returns 404 for an unknown campaign", async () => {
    vi.mocked(getCampaignAudienceCount).mockRejectedValue(
      new CampaignError("not_found"),
    );

    const res = await AUDIENCE(audienceRequest(), props);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
  });
});

describe("POST send", () => {
  it("returns the send summary", async () => {
    const summary = { status: "PARTIAL", sent: 9, failed: 1, total: 10 } as const;
    vi.mocked(sendCampaign).mockResolvedValue(summary);

    const res = await SEND(sendRequest(), props);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(summary);
    expect(sendCampaign).toHaveBeenCalledWith("c1");
  });

  it.each([
    ["campaign_not_sendable", 409, { error: "campaign_not_sendable" }],
    ["campaign_empty_audience", 400, { error: "campaign_empty_audience" }],
    ["invalid_promo_code", 400, { error: "invalid_promo_code" }],
    ["not_found", 404, { error: "Not found" }],
  ] as const)("maps %s to %i", async (code, status, body) => {
    vi.mocked(sendCampaign).mockRejectedValue(new CampaignError(code));

    const res = await SEND(sendRequest(), props);

    expect(res.status).toBe(status);
    expect(await res.json()).toEqual(body);
  });

  it("returns 500 on unexpected failures", async () => {
    vi.mocked(sendCampaign).mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await SEND(sendRequest(), props);

    expect(res.status).toBe(500);
  });
});
