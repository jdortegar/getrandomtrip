import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import { CampaignsPageClient } from "@/components/app/admin/email-campaigns/CampaignsPageClient";
import type { CampaignListItem } from "@/types/emailCampaign";
import {
  click,
  deferred,
  field,
  flush,
  jsonResponse,
  mount,
  setValue,
  stubFetchWithSegments,
  type Mounted,
} from "./emailCampaignsTestUtils";

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "es" }),
  useRouter: () => ({ push: vi.fn() }),
}));

const pageCopy = es.adminPages.emailCampaigns;
const copy = pageCopy.campaigns;
const filterCopy = es.common.tableFilters;

let mounted: Mounted | undefined;

function campaign(overrides: Partial<CampaignListItem> = {}): CampaignListItem {
  return {
    bodyMarkdown: "Hola",
    createdAt: "2026-06-01T00:00:00.000Z",
    id: "camp-1",
    locale: "es",
    name: "Fundadores",
    promoCode: "FUNDADOR30",
    segments: [{ id: "seg_waitlist", name: "Lista de espera", systemKey: "WAITLIST" as const }],
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

function draft(overrides: Partial<CampaignListItem> = {}): CampaignListItem {
  return campaign({
    createdAt: "2026-06-10T00:00:00.000Z",
    id: "camp-2",
    name: "Amigos",
    promoCode: null,
    segments: [{ id: "seg_friends_family", name: "Amigos y familia", systemKey: "FRIENDS_FAMILY" as const }, { id: "seg_waitlist", name: "Lista de espera", systemKey: "WAITLIST" as const }],
    sentAt: null,
    status: "DRAFT",
    subject: "Para la familia",
    summary: {
      conversions: 0,
      id: "camp-2",
      revenue: 0,
      sent: 0,
      uniqueClicks: 0,
      uniqueOpens: 0,
    },
    ...overrides,
  });
}

function partial(): CampaignListItem {
  return campaign({
    id: "camp-3",
    name: "Zafiro",
    promoCode: "ZAFIRO",
    segments: [
      { id: "seg_friends_family", name: "Amigos y familia", systemKey: "FRIENDS_FAMILY" as const },
      { id: "seg-custom", name: "Viajeros frecuentes", systemKey: null },
    ],
    sentAt: "2026-07-01T12:00:00.000Z",
    status: "PARTIAL",
    subject: "Oferta especial",
    summary: {
      conversions: 9,
      id: "camp-3",
      revenue: 100,
      sent: 10,
      uniqueClicks: 5,
      uniqueOpens: 7,
    },
  });
}

const fetchMock = vi.fn();

function listResponse(campaigns: CampaignListItem[]) {
  return jsonResponse(200, { campaigns });
}

async function renderWith(campaigns: CampaignListItem[]) {
  fetchMock.mockResolvedValueOnce(listResponse(campaigns));
  mounted = mount(<CampaignsPageClient />);
  await flush();
  return mounted.container;
}

function rowNames(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("tbody tr")).map(
    (row) => row.querySelector("td a")?.textContent ?? "",
  );
}

function rowById(container: HTMLElement, name: string): HTMLTableRowElement {
  const row = Array.from(container.querySelectorAll("tbody tr")).find(
    (r) => r.querySelector("td a")?.textContent === name,
  );
  if (!row) throw new Error(`Row ${name} not found`);
  return row as HTMLTableRowElement;
}

function headerTexts(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("thead th")).map(
    (th) => th.textContent?.trim() ?? "",
  );
}

function sortHeader(container: HTMLElement, label: string): HTMLTableCellElement {
  const th = Array.from(container.querySelectorAll("thead th")).find(
    (cell) => cell.textContent?.trim() === label,
  );
  if (!th) throw new Error(`Header ${label} not found`);
  return th as HTMLTableCellElement;
}

function sortButton(container: HTMLElement, label: string) {
  return sortHeader(container, label).querySelector("button");
}

function dialogButton(text: string): HTMLButtonElement | undefined {
  return Array.from(document.querySelectorAll("button")).find(
    (button) => button.textContent?.trim() === text,
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  stubFetchWithSegments(fetchMock);
});

afterEach(() => {
  mounted?.unmount();
  mounted = undefined;
  vi.unstubAllGlobals();
});

describe("CampaignsPageClient", () => {
  it("renders the comparison table with summary metrics", async () => {
    const container = await renderWith([campaign(), draft()]);

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/email-campaigns/campaigns");
    const rows = Array.from(container.querySelectorAll("tbody tr"));
    expect(rows).toHaveLength(2);

    const sent = rows[0]?.textContent ?? "";
    expect(sent).toContain("Fundadores");
    expect(sent).toContain("Tu descuento de fundador");
    expect(sent).toContain("FUNDADOR30");
    expect(sent).toContain("25%");
    expect(sent).toContain("1290,50");
    expect(rows[0]?.querySelector("a")?.getAttribute("href")).toBe(
      "/dashboard/admin/email-campaigns/camp-1",
    );

    const draftRow = rows[1]?.textContent ?? "";
    expect(draftRow).toContain(copy.notSent);
    expect(draftRow).toContain("—");

    const badges = Array.from(
      container.querySelectorAll('[data-component="StatusIndicatorBadge"]'),
    ).map((badge) => badge.textContent);
    expect(badges).toEqual([copy.status.SENT, copy.status.DRAFT]);
  });

  it("drops the language, segment, sent and opens columns and adds actions", async () => {
    const container = await renderWith([campaign()]);
    const headers = headerTexts(container);

    expect(headers).toEqual([
      copy.columns.campaign,
      copy.columns.status,
      copy.columns.promoCode,
      copy.columns.sentAt,
      copy.columns.clicks,
      copy.columns.conversions,
      copy.columns.revenue,
      copy.columns.actions,
    ]);
    const row = container.querySelector("tbody tr")?.textContent ?? "";
    expect(row).not.toContain(pageCopy.locales.es);
    expect(row).not.toContain(pageCopy.contacts.source.WAITLIST);
    expect(row).not.toContain("75%");
  });

  it("links the primary CTA to the new campaign page", async () => {
    const container = await renderWith([campaign()]);

    const cta = Array.from(container.querySelectorAll("a")).find((a) =>
      a.textContent?.includes(copy.newCampaign),
    );
    expect(cta?.getAttribute("href")).toBe("/dashboard/admin/email-campaigns/new");
  });

  it("shows the empty state with a CTA", async () => {
    const container = await renderWith([]);

    expect(container.textContent).toContain(copy.empty.title);
    expect(container.textContent).toContain(copy.empty.body);
    const ctas = Array.from(container.querySelectorAll("a")).filter(
      (a) => a.getAttribute("href") === "/dashboard/admin/email-campaigns/new",
    );
    expect(ctas.length).toBe(2);
  });

  it("shows the error state and retries", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(500, { error: "Internal server error" }));
    fetchMock.mockResolvedValueOnce(listResponse([campaign()]));
    mounted = mount(<CampaignsPageClient />);
    await flush();
    const { container } = mounted;

    expect(container.textContent).toContain(copy.errorLoad);
    const retry = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes(filterCopy.retry),
    );
    await click(retry);
    await flush();

    expect(container.textContent).toContain("Fundadores");
  });

  describe("filters", () => {
    it("searches over name and subject, then clears", async () => {
      const container = await renderWith([campaign(), draft(), partial()]);
      expect(container.textContent).toContain(`3 ${filterCopy.of} 3 ${filterCopy.count}`);

      setValue(field<HTMLInputElement>(container, "email-campaigns-search"), "familia");
      expect(rowNames(container)).toEqual(["Amigos"]);
      expect(container.textContent).toContain(`1 ${filterCopy.of} 3 ${filterCopy.count}`);

      setValue(field<HTMLInputElement>(container, "email-campaigns-search"), "zaf");
      expect(rowNames(container)).toEqual(["Zafiro"]);

      const clear = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === filterCopy.clearFilters,
      );
      await click(clear);
      expect(rowNames(container)).toHaveLength(3);
      expect(field<HTMLInputElement>(container, "email-campaigns-search").value).toBe("");
    });

    it("filters by status and segment and shows the no-matches state", async () => {
      const container = await renderWith([campaign(), draft(), partial()]);

      setValue(field<HTMLSelectElement>(container, "email-campaigns-status"), "DRAFT");
      expect(rowNames(container)).toEqual(["Amigos"]);

      setValue(field<HTMLSelectElement>(container, "email-campaigns-status"), "");
      const segmentSelect = field<HTMLSelectElement>(container, "email-campaigns-segment");
      expect(Array.from(segmentSelect.options).map((option) => option.textContent)).toEqual([
        copy.filters.allSegments,
        "Lista de espera",
        "Amigos y familia",
        "Viajeros frecuentes",
      ]);
      setValue(segmentSelect, "seg-custom");
      expect(rowNames(container)).toEqual(["Zafiro"]);

      setValue(segmentSelect, "seg_friends_family");
      expect(rowNames(container).sort()).toEqual(["Amigos", "Zafiro"]);

      setValue(field<HTMLSelectElement>(container, "email-campaigns-status"), "SENT");
      expect(rowNames(container)).toEqual([]);
      expect(container.textContent).toContain(copy.noMatches);
    });
  });

  describe("sorting", () => {
    it("defaults to newest sent first, drafts by creation date", async () => {
      const container = await renderWith([campaign(), draft(), partial()]);

      expect(rowNames(container)).toEqual(["Zafiro", "Fundadores", "Amigos"]);
      expect(sortHeader(container, copy.columns.sentAt).getAttribute("aria-sort")).toBe(
        "descending",
      );
      expect(sortHeader(container, copy.columns.campaign).getAttribute("aria-sort")).toBe(
        "none",
      );
    });

    it("toggles name order and reflects it in aria-sort", async () => {
      const container = await renderWith([campaign(), draft(), partial()]);

      await click(sortButton(container, copy.columns.campaign));
      expect(rowNames(container)).toEqual(["Amigos", "Fundadores", "Zafiro"]);
      expect(sortHeader(container, copy.columns.campaign).getAttribute("aria-sort")).toBe(
        "ascending",
      );
      expect(sortHeader(container, copy.columns.sentAt).getAttribute("aria-sort")).toBe(
        "none",
      );

      await click(sortButton(container, copy.columns.campaign));
      expect(rowNames(container)).toEqual(["Zafiro", "Fundadores", "Amigos"]);
      expect(sortHeader(container, copy.columns.campaign).getAttribute("aria-sort")).toBe(
        "descending",
      );
    });

    it("sorts by conversions and revenue, highest first", async () => {
      const container = await renderWith([campaign(), draft(), partial()]);

      await click(sortButton(container, copy.columns.conversions));
      expect(rowNames(container)).toEqual(["Zafiro", "Fundadores", "Amigos"]);
      expect(
        sortHeader(container, copy.columns.conversions).getAttribute("aria-sort"),
      ).toBe("descending");

      await click(sortButton(container, copy.columns.revenue));
      expect(rowNames(container)).toEqual(["Fundadores", "Zafiro", "Amigos"]);

      await click(sortButton(container, copy.columns.revenue));
      expect(rowNames(container)).toEqual(["Amigos", "Zafiro", "Fundadores"]);
      expect(sortHeader(container, copy.columns.revenue).getAttribute("aria-sort")).toBe(
        "ascending",
      );
    });
  });

  describe("row actions", () => {
    it("links view for sent campaigns and edit for drafts; delete only on drafts", async () => {
      const container = await renderWith([campaign(), draft()]);

      const sentRow = rowById(container, "Fundadores");
      const sentActions = sentRow.querySelector('[data-component="CampaignRowActions"]');
      const view = sentActions?.querySelector('[data-component="TableIconLink"] a');
      expect(view?.getAttribute("href")).toBe("/dashboard/admin/email-campaigns/camp-1");
      expect(sentActions?.textContent).toContain(copy.actions.view);
      expect(sentActions?.querySelector(`button[aria-label="${copy.actions.delete}"]`)).toBeNull();

      const draftRow = rowById(container, "Amigos");
      const draftActions = draftRow.querySelector('[data-component="CampaignRowActions"]');
      const edit = draftActions?.querySelector('[data-component="TableIconLink"] a');
      expect(edit?.getAttribute("href")).toBe("/dashboard/admin/email-campaigns/camp-2");
      expect(draftActions?.textContent).toContain(copy.actions.edit);
      expect(
        draftActions?.querySelector(`button[aria-label="${copy.actions.delete}"]`),
      ).not.toBeNull();
    });

    it("confirms, shows pending feedback, deletes and removes the row", async () => {
      const container = await renderWith([campaign(), draft()]);
      const pending = deferred<ReturnType<typeof jsonResponse>>();
      fetchMock.mockReturnValueOnce(pending.promise);

      const trigger = rowById(container, "Amigos").querySelector<HTMLButtonElement>(
        `button[aria-label="${copy.actions.delete}"]`,
      );
      await click(trigger);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(document.body.textContent).toContain(copy.delete.title);
      expect(document.body.textContent).toContain(
        copy.delete.body.replace("{name}", "Amigos"),
      );

      await click(dialogButton(copy.delete.confirm));
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/admin/email-campaigns/campaigns/camp-2",
        { method: "DELETE" },
      );
      const busy = dialogButton(copy.delete.deleting);
      expect(busy?.disabled).toBe(true);
      expect(busy?.getAttribute("aria-busy")).toBe("true");
      expect(busy?.querySelector(".animate-spin")).not.toBeNull();
      expect(trigger?.getAttribute("aria-busy")).toBe("true");

      await click(busy);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      pending.resolve(jsonResponse(200, { ok: true }));
      await flush();

      expect(rowNames(container)).toEqual(["Fundadores"]);
      expect(dialogButton(copy.delete.confirm)).toBeUndefined();
      expect(container.textContent).toContain(`1 ${filterCopy.of} 1 ${filterCopy.count}`);
    });

    it("maps a refused delete to its message and allows retry", async () => {
      const container = await renderWith([campaign(), draft()]);
      fetchMock.mockResolvedValueOnce(jsonResponse(409, { error: "campaign_not_editable" }));

      await click(
        rowById(container, "Amigos").querySelector<HTMLButtonElement>(
          `button[aria-label="${copy.actions.delete}"]`,
        ),
      );
      await click(dialogButton(copy.delete.confirm));
      await flush();

      const alert = document.querySelector('[role="alert"]');
      expect(alert?.textContent).toBe(pageCopy.errors.notEditable);
      expect(rowNames(container)).toEqual(["Fundadores", "Amigos"]);

      const retry = dialogButton(copy.delete.confirm);
      expect(retry?.disabled).toBe(false);
      fetchMock.mockResolvedValueOnce(jsonResponse(404, {}));
      await click(retry);
      await flush();
      expect(document.querySelector('[role="alert"]')?.textContent).toBe(
        pageCopy.errors.notFound,
      );
    });

    it("cancel closes the confirmation without deleting", async () => {
      const container = await renderWith([draft()]);

      await click(
        rowById(container, "Amigos").querySelector<HTMLButtonElement>(
          `button[aria-label="${copy.actions.delete}"]`,
        ),
      );
      await click(dialogButton(copy.delete.cancel));
      await flush();

      expect(dialogButton(copy.delete.confirm)).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(rowNames(container)).toEqual(["Amigos"]);
    });
  });
});
