import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import { CampaignDetailPageClient } from "@/components/app/admin/email-campaigns/CampaignDetailPageClient";
import type { Campaign } from "@/types/emailCampaign";
import {
  buttonByText,
  click,
  draftCampaign,
  field,
  flush,
  jsonResponse,
  mount,
  setValue,
  type Mounted,
} from "./emailCampaignsTestUtils";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "es" }),
  useRouter: () => ({ push }),
}));

const pageCopy = es.adminPages.emailCampaigns;
const API = "/api/admin/email-campaigns/campaigns/camp-1";
const fetchMock = vi.fn();
let view: Mounted | undefined;

type Handler = (init: RequestInit | undefined) => ReturnType<typeof jsonResponse>;

function routes(table: Record<string, Handler>) {
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? "GET"} ${url}`;
    const handler = table[key];
    if (!handler) throw new Error(`Unexpected fetch ${key}`);
    return handler(init);
  });
}

function callsTo(key: string) {
  return fetchMock.mock.calls.filter(
    ([url, init]) => `${(init as RequestInit | undefined)?.method ?? "GET"} ${url}` === key,
  );
}

async function open(campaign: Campaign, extra: Record<string, Handler> = {}) {
  routes({ [`GET ${API}`]: () => jsonResponse(200, { campaign }), ...extra });
  view = mount(<CampaignDetailPageClient campaignId="camp-1" />);
  await flush();
  return view.container;
}

beforeEach(() => {
  push.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  view?.unmount();
  view = undefined;
  vi.unstubAllGlobals();
});

describe("CampaignDetailPageClient", () => {
  it("loads a draft into the editor with preview, send and delete controls", async () => {
    const container = await open(draftCampaign());

    expect(field<HTMLInputElement>(container, "campaign-name").value).toBe("Fundadores");
    expect(field<HTMLTextAreaElement>(container, "campaign-body").value).toBe(
      "Hola **fundador**",
    );
    expect(container.querySelector("iframe")).not.toBeNull();
    expect(buttonByText(container, pageCopy.send.sendNow)).toBeDefined();
    expect(buttonByText(container, pageCopy.editor.delete.button)).toBeDefined();
    expect(container.querySelector('[data-component="CampaignMetricsPanel"]')).toBeNull();
  });

  it("sends only changed fields on PATCH, always with the CTA label and URL together", async () => {
    const container = await open(draftCampaign(), {
      [`PATCH ${API}`]: () =>
        jsonResponse(200, {
          campaign: draftCampaign({ ctaUrl: "https://getrandomtrip.com/en" }),
        }),
    });
    setValue(field(container, "campaign-cta-url"), "https://getrandomtrip.com/en");

    await click(buttonByText(container, pageCopy.editor.save));
    await flush();

    const [, init] = callsTo(`PATCH ${API}`)[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      ctaLabel: "Reservar",
      ctaUrl: "https://getrandomtrip.com/en",
    });
    expect(container.textContent).toContain(pageCopy.editor.saved);
  });

  it("maps campaign_not_editable on save", async () => {
    const container = await open(draftCampaign(), {
      [`PATCH ${API}`]: () => jsonResponse(409, { error: "campaign_not_editable" }),
    });
    setValue(field(container, "campaign-title"), "Nuevo título");

    await click(buttonByText(container, pageCopy.editor.save));
    await flush();

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      pageCopy.errors.notEditable,
    );
  });

  it("deletes a draft only after the inline confirmation", async () => {
    const container = await open(draftCampaign(), {
      [`DELETE ${API}`]: () => jsonResponse(200, { ok: true }),
    });
    const del = pageCopy.editor.delete;

    await click(buttonByText(container, del.button));
    expect(callsTo(`DELETE ${API}`)).toHaveLength(0);
    expect(container.textContent).toContain(del.confirmBody);

    await click(buttonByText(container, del.cancel));
    expect(container.textContent).not.toContain(del.confirmBody);

    await click(buttonByText(container, del.button));
    await click(buttonByText(container, del.confirm));
    await flush();

    expect(callsTo(`DELETE ${API}`)).toHaveLength(1);
    expect(push).toHaveBeenCalledWith("/dashboard/admin/email-campaigns");
  });

  it("shows a localized error when the delete is refused", async () => {
    const container = await open(draftCampaign(), {
      [`DELETE ${API}`]: () => jsonResponse(409, { error: "campaign_not_editable" }),
    });
    const del = pageCopy.editor.delete;

    await click(buttonByText(container, del.button));
    await click(buttonByText(container, del.confirm));
    await flush();

    expect(container.textContent).toContain(pageCopy.errors.notEditable);
    expect(push).not.toHaveBeenCalled();
  });

  it("shows metrics instead of the editor once the campaign was sent", async () => {
    const container = await open(
      draftCampaign({ sentAt: "2026-06-18T12:00:00.000Z", status: "SENT" }),
      {
        [`GET ${API}/metrics`]: () =>
          jsonResponse(200, {
            metrics: {
              bounced: 0,
              conversions: { attributed: 0, shared: 0 },
              currency: "USD",
              delivered: 1,
              discountTotal: null,
              failed: 0,
              otherCurrencyConversions: 0,
              revenue: 0,
              sent: 1,
              uniqueClicks: 0,
              uniqueOpens: 1,
            },
            recipients: [],
          }),
      },
    );

    expect(container.querySelector("#campaign-name")).toBeNull();
    expect(buttonByText(container, pageCopy.editor.delete.button)).toBeUndefined();
    expect(buttonByText(container, pageCopy.send.sendNow)).toBeUndefined();
    expect(container.querySelector('[data-component="CampaignMetricsPanel"]')).not.toBeNull();
    expect(container.textContent).toContain(pageCopy.campaigns.status.SENT);
  });

  it("shows the not-found state for an unknown campaign", async () => {
    routes({ [`GET ${API}`]: () => jsonResponse(404, { error: "Not found" }) });
    view = mount(<CampaignDetailPageClient campaignId="camp-1" />);
    await flush();

    expect(view.container.textContent).toContain(pageCopy.detail.notFound);
    expect(
      view.container.querySelector('a[href="/dashboard/admin/email-campaigns"]'),
    ).not.toBeNull();
  });

  it("shows the load error and retries", async () => {
    let attempts = 0;
    routes({
      [`GET ${API}`]: () => {
        attempts += 1;
        return attempts === 1
          ? jsonResponse(500, { error: "Internal server error" })
          : jsonResponse(200, { campaign: draftCampaign() });
      },
    });
    view = mount(<CampaignDetailPageClient campaignId="camp-1" />);
    await flush();

    expect(view.container.textContent).toContain(pageCopy.detail.errorLoad);
    await click(buttonByText(view.container, es.common.tableFilters.retry));
    await flush();

    expect(field<HTMLInputElement>(view.container, "campaign-name").value).toBe(
      "Fundadores",
    );
  });
});
