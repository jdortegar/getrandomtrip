import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import { CampaignsPageClient } from "@/components/app/admin/email-campaigns/CampaignsPageClient";
import type { CampaignListItem } from "@/types/emailCampaign";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "es" }),
  useRouter: () => ({ push: vi.fn() }),
}));

const pageCopy = es.adminPages.emailCampaigns;
const copy = pageCopy.campaigns;

let container: HTMLDivElement;
let root: Root;

function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<CampaignsPageClient />);
  });
}

async function flush() {
  await act(async () => {
    for (let i = 0; i < 5; i += 1) await Promise.resolve();
  });
}

function campaign(overrides: Partial<CampaignListItem> = {}): CampaignListItem {
  return {
    bodyMarkdown: "Hola",
    createdAt: "2026-06-01T00:00:00.000Z",
    id: "camp-1",
    locale: "es",
    name: "Fundadores",
    promoCode: "FUNDADOR30",
    segmentSources: ["WAITLIST"],
    sentAt: "2026-06-18T12:00:00.000Z",
    status: "SENT",
    subject: "Tu descuento de fundador",
    title: "Hola",
    updatedAt: "2026-06-18T12:00:00.000Z",
    summary: {
      conversions: 3,
      id: "camp-1",
      revenue: 1290.5,
      sent: 8,
      uniqueClicks: 2,
      uniqueOpens: 6,
    },
    ...overrides,
  };
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});

describe("CampaignsPageClient", () => {
  it("renders the comparison table with summary metrics", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        campaigns: [
          campaign(),
          campaign({
            id: "camp-2",
            name: "Amigos",
            promoCode: null,
            segmentSources: ["FRIENDS_FAMILY", "WAITLIST"],
            sentAt: null,
            status: "DRAFT",
            summary: {
              conversions: 0,
              id: "camp-2",
              revenue: 0,
              sent: 0,
              uniqueClicks: 0,
              uniqueOpens: 0,
            },
          }),
        ],
      }),
    });
    render();
    await flush();

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/email-campaigns/campaigns");
    const rows = Array.from(container.querySelectorAll("tbody tr"));
    expect(rows).toHaveLength(2);

    const sent = rows[0]?.textContent ?? "";
    expect(sent).toContain("Fundadores");
    expect(sent).toContain("Tu descuento de fundador");
    expect(sent).toContain("FUNDADOR30");
    expect(sent).toContain(pageCopy.contacts.source.WAITLIST);
    expect(sent).toContain(pageCopy.locales.es);
    expect(sent).toContain("75%");
    expect(sent).toContain("25%");
    expect(sent).toContain("1290,50");
    expect(rows[0]?.querySelector("a")?.getAttribute("href")).toBe(
      "/dashboard/admin/email-campaigns/camp-1",
    );

    const draft = rows[1]?.textContent ?? "";
    expect(draft).toContain(copy.notSent);
    expect(draft).toContain(pageCopy.contacts.source.FRIENDS_FAMILY);

    const badges = Array.from(
      container.querySelectorAll('[data-component="StatusIndicatorBadge"]'),
    ).map((badge) => badge.textContent);
    expect(badges).toEqual([copy.status.SENT, copy.status.DRAFT]);
  });

  it("links the primary CTA to the new campaign page", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ campaigns: [campaign()] }),
    });
    render();
    await flush();

    const cta = Array.from(container.querySelectorAll("a")).find((a) =>
      a.textContent?.includes(copy.newCampaign),
    );
    expect(cta?.getAttribute("href")).toBe("/dashboard/admin/email-campaigns/new");
  });

  it("shows the empty state with a CTA", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ campaigns: [] }),
    });
    render();
    await flush();

    expect(container.textContent).toContain(copy.empty.title);
    expect(container.textContent).toContain(copy.empty.body);
    const ctas = Array.from(container.querySelectorAll("a")).filter(
      (a) =>
        a.getAttribute("href") === "/dashboard/admin/email-campaigns/new",
    );
    expect(ctas.length).toBe(2);
  });

  it("shows the error state and retries", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal server error" }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ campaigns: [campaign()] }),
    });
    render();
    await flush();

    expect(container.textContent).toContain(copy.errorLoad);
    const retry = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes(es.common.tableFilters.retry),
    );
    await act(async () => {
      retry?.click();
    });
    await flush();

    expect(container.textContent).toContain("Fundadores");
  });
});
