import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import { CampaignMetricsPanel } from "@/components/app/admin/email-campaigns/CampaignMetricsPanel";
import type { CampaignMetrics, CampaignRecipient } from "@/types/emailCampaign";
import {
  buttonByText,
  click,
  flush,
  jsonResponse,
  mount,
  type Mounted,
} from "./emailCampaignsTestUtils";

const pageCopy = es.adminPages.emailCampaigns;
const copy = pageCopy.metrics;
const fetchMock = vi.fn();
let view: Mounted | undefined;

function metrics(overrides: Partial<CampaignMetrics> = {}): CampaignMetrics {
  return {
    bounced: 1,
    conversions: { attributed: 2, shared: 1 },
    currency: "USD",
    delivered: 7,
    discountTotal: null,
    failed: 2,
    otherCurrencyConversions: 0,
    revenue: 1290.5,
    sent: 8,
    uniqueClicks: 2,
    uniqueOpens: 6,
    ...overrides,
  };
}

const recipients: CampaignRecipient[] = [
  {
    clicked: true,
    email: "ana@example.com",
    name: "Ana",
    opened: true,
    purchased: true,
    sendId: "send-1",
    sentAt: "2026-06-18T12:00:00.000Z",
    status: "DELIVERED",
  },
  {
    clicked: false,
    email: "beto@example.com",
    name: null,
    opened: false,
    purchased: false,
    sendId: "send-2",
    sentAt: null,
    status: "FAILED",
  },
];

function render() {
  view = mount(
    <CampaignMetricsPanel
      campaignId="camp-1"
      copy={copy}
      locale="es"
      recipientsCopy={pageCopy.recipients}
      retryCopy={es.common.tableFilters}
    />,
  );
  return view.container;
}

function kpi(container: HTMLElement, label: string) {
  return Array.from(
    container.querySelectorAll('[data-component="CampaignKpiCard"]'),
  ).find((card) => card.textContent?.includes(label))?.textContent;
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  view?.unmount();
  view = undefined;
  vi.unstubAllGlobals();
});

describe("CampaignMetricsPanel", () => {
  it("renders KPI cards, the supporting strip and the opens footnote", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { metrics: metrics(), recipients }));
    const container = render();
    await flush();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/email-campaigns/campaigns/camp-1/metrics",
    );
    expect(kpi(container, copy.kpis.sent)).toContain("8");
    expect(kpi(container, copy.kpis.delivered)).toContain("7");
    expect(kpi(container, copy.kpis.opens)).toContain("75%");
    expect(kpi(container, copy.kpis.clicks)).toContain("25%");
    expect(kpi(container, copy.kpis.conversions)).toContain("2");
    expect(kpi(container, copy.kpis.conversions)).toContain(
      copy.conversionsHint.replace("{shared}", "1"),
    );
    expect(kpi(container, copy.kpis.revenue)).toContain("1290,50");
    expect(kpi(container, copy.kpis.discount)).toContain("—");

    const strip = container.querySelector('[data-component="CampaignMetricsStrip"]')
      ?.textContent;
    expect(strip).toContain(`${copy.bounced}1`);
    expect(strip).toContain(`${copy.failed}2`);
    expect(container.textContent).toContain(copy.opensNote);
  });

  it("formats a known discount total and flags other-currency conversions", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        metrics: metrics({ discountTotal: 45, otherCurrencyConversions: 1 }),
        recipients,
      }),
    );
    const container = render();
    await flush();

    expect(kpi(container, copy.kpis.discount)).toContain("45,00");
    expect(container.textContent).toContain(copy.otherCurrency.replace("{count}", "1"));
  });

  it("shows rates as — before anything was sent", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        metrics: metrics({ delivered: 0, sent: 0, uniqueClicks: 0, uniqueOpens: 0 }),
        recipients: [],
      }),
    );
    const container = render();
    await flush();

    expect(kpi(container, copy.kpis.opens)).toContain("—");
    expect(container.textContent).toContain(pageCopy.recipients.empty);
  });

  it("renders the recipients table with status badges and yes/no flags", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { metrics: metrics(), recipients }));
    const container = render();
    await flush();

    const rows = Array.from(container.querySelectorAll("tbody tr"));
    expect(rows).toHaveLength(2);
    const [first, second] = rows.map((row) =>
      Array.from(row.querySelectorAll("td")).map((cell) => cell.textContent),
    );
    const r = pageCopy.recipients;
    expect(first).toEqual([
      "ana@example.com",
      "Ana",
      r.status.DELIVERED,
      r.yes,
      r.yes,
      r.yes,
    ]);
    expect(second).toEqual(["beto@example.com", "—", r.status.FAILED, r.no, r.no, r.no]);
    expect(
      container.querySelectorAll('[data-component="StatusIndicatorBadge"]'),
    ).toHaveLength(2);
  });

  it("shows the load error and retries", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(500, { error: "Internal server error" }))
      .mockResolvedValueOnce(jsonResponse(200, { metrics: metrics(), recipients }));
    const container = render();
    await flush();

    expect(container.textContent).toContain(copy.errorLoad);
    await click(buttonByText(container, es.common.tableFilters.retry));
    await flush();

    expect(container.querySelectorAll("tbody tr")).toHaveLength(2);
  });
});
