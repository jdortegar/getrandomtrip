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
  return {
    ...original,
    deleteCampaign: vi.fn(),
    getCampaign: vi.fn(),
    renderCampaignPreview: vi.fn(),
    sendCampaignTest: vi.fn(),
    updateCampaign: vi.fn(),
  };
});

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import {
  CampaignError,
  deleteCampaign,
  getCampaign,
  renderCampaignPreview,
  sendCampaignTest,
  updateCampaign,
} from "@/lib/email-campaigns/campaigns";
import { DELETE, GET, PATCH } from "../route";
import { GET as PREVIEW } from "../preview/route";
import { POST as TEST_SEND } from "../test-send/route";

const BASE = "http://localhost/api/admin/email-campaigns/campaigns/c1";
const props = { params: Promise.resolve({ id: "c1" }) };

function asAdmin() {
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "a1" } });
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "a1",
    roles: ["ADMIN"],
  } as never);
}

function patchRequest(body: unknown): NextRequest {
  return new NextRequest(BASE, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  asAdmin();
});

describe("auth", () => {
  it("returns 401 without a session on every handler", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const responses = await Promise.all([
      GET(new NextRequest(BASE), props),
      PATCH(patchRequest({ title: "x" }), props),
      DELETE(new NextRequest(BASE, { method: "DELETE" }), props),
      PREVIEW(new NextRequest(`${BASE}/preview`), props),
      TEST_SEND(new NextRequest(`${BASE}/test-send`, { method: "POST" }), props),
    ]);

    expect(responses.map((res) => res.status)).toEqual([401, 401, 401, 401, 401]);
    expect(sendCampaignTest).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-admin", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "a1",
      roles: ["TRIPPER"],
    } as never);

    const res = await TEST_SEND(
      new NextRequest(`${BASE}/test-send`, { method: "POST" }),
      props,
    );

    expect(res.status).toBe(403);
    expect(sendCampaignTest).not.toHaveBeenCalled();
  });
});

describe("GET", () => {
  it("returns the campaign or 404", async () => {
    vi.mocked(getCampaign).mockResolvedValueOnce({ id: "c1" } as never);
    const found = await GET(new NextRequest(BASE), props);
    expect(await found.json()).toEqual({ campaign: { id: "c1" } });

    vi.mocked(getCampaign).mockResolvedValueOnce(null);
    expect((await GET(new NextRequest(BASE), props)).status).toBe(404);
  });
});

describe("PATCH", () => {
  it("updates with parsed input, clearing an empty promo code", async () => {
    vi.mocked(updateCampaign).mockResolvedValue({ id: "c1" } as never);

    const res = await PATCH(patchRequest({ promoCode: "" }), props);

    expect(res.status).toBe(200);
    expect(updateCampaign).toHaveBeenCalledWith("c1", { promoCode: null });
  });

  it("returns 400 for invalid input", async () => {
    const res = await PATCH(patchRequest({ locale: "pt" }), props);
    expect(res.status).toBe(400);
    expect(updateCampaign).not.toHaveBeenCalled();
  });

  it.each([
    ["campaign_not_editable", 409, { error: "campaign_not_editable" }],
    ["invalid_promo_code", 400, { error: "invalid_promo_code" }],
    ["not_found", 404, { error: "Not found" }],
  ] as const)("maps %s to %i", async (code, status, body) => {
    vi.mocked(updateCampaign).mockRejectedValue(new CampaignError(code));

    const res = await PATCH(patchRequest({ title: "x" }), props);

    expect(res.status).toBe(status);
    expect(await res.json()).toEqual(body);
  });
});

describe("DELETE", () => {
  it("deletes a draft", async () => {
    const res = await DELETE(new NextRequest(BASE, { method: "DELETE" }), props);

    expect(res.status).toBe(200);
    expect(deleteCampaign).toHaveBeenCalledWith("c1");
  });

  it("returns 409 for a non-draft", async () => {
    vi.mocked(deleteCampaign).mockRejectedValue(
      new CampaignError("campaign_not_editable"),
    );

    const res = await DELETE(new NextRequest(BASE, { method: "DELETE" }), props);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "campaign_not_editable" });
  });
});

describe("preview", () => {
  it("returns the rendered email as uncached html", async () => {
    vi.mocked(renderCampaignPreview).mockResolvedValue("<html>hi</html>");

    const res = await PREVIEW(new NextRequest(`${BASE}/preview`), props);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.text()).toBe("<html>hi</html>");
  });

  it("returns 404 for a missing campaign", async () => {
    vi.mocked(renderCampaignPreview).mockRejectedValue(
      new CampaignError("not_found"),
    );

    const res = await PREVIEW(new NextRequest(`${BASE}/preview`), props);

    expect(res.status).toBe(404);
  });
});

describe("test-send", () => {
  it("sends to the logged-in admin", async () => {
    vi.mocked(sendCampaignTest).mockResolvedValue({ to: "admin@x.com" });

    const res = await TEST_SEND(
      new NextRequest(`${BASE}/test-send`, { method: "POST" }),
      props,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, to: "admin@x.com" });
    expect(sendCampaignTest).toHaveBeenCalledWith("c1", "a1");
  });

  it("returns 500 when delivery fails", async () => {
    vi.mocked(sendCampaignTest).mockRejectedValue(new Error("resend down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await TEST_SEND(
      new NextRequest(`${BASE}/test-send`, { method: "POST" }),
      props,
    );

    expect(res.status).toBe(500);
  });
});
