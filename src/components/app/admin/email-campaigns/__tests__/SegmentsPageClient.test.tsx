import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import { SegmentsPageClient } from "@/components/app/admin/email-campaigns/SegmentsPageClient";
import type { SegmentSummary } from "@/types/emailCampaign";
import {
  buttonByText,
  click,
  deferred,
  flush,
  jsonResponse,
  mount,
  SEGMENT_FIXTURES,
  SEGMENTS_URL,
  segmentSummary,
  setValue,
  type Mounted,
} from "./emailCampaignsTestUtils";

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "es" }),
  useRouter: () => ({ push: vi.fn() }),
}));

const pageCopy = es.adminPages.emailCampaigns;
const copy = pageCopy.segments;
const fetchMock = vi.fn();
let view: Mounted | undefined;
let listed: SegmentSummary[];

type Handler = (init: RequestInit | undefined) => unknown;

/** GET of the list answers with `listed`; other requests go to `table` by `METHOD url`. */
function routes(table: Record<string, Handler> = {}) {
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? "GET"} ${url}`;
    if (key === `GET ${SEGMENTS_URL}`) return jsonResponse(200, { segments: listed });
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

async function render() {
  view = mount(<SegmentsPageClient />);
  await flush();
  return view.container;
}

function rowByName(container: HTMLElement, name: string): HTMLTableRowElement {
  const row = Array.from(container.querySelectorAll("tbody tr")).find((r) =>
    r.querySelector("td")?.textContent?.startsWith(name),
  );
  if (!row) throw new Error(`Row ${name} not found`);
  return row as HTMLTableRowElement;
}

function rowButton(row: HTMLElement, label: string) {
  return row.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
}

function dialog(): HTMLElement | null {
  return document.querySelector('[role="dialog"]');
}

function dialogButton(text: string): HTMLButtonElement | undefined {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')).find(
    (button) => button.textContent?.trim() === text,
  );
}

function dialogField<T extends HTMLElement>(id: string): T {
  const found = document.querySelector(`[role="dialog"] #${id}`);
  if (!found) throw new Error(`Dialog field #${id} not found`);
  return found as T;
}

beforeEach(() => {
  fetchMock.mockReset();
  listed = [...SEGMENT_FIXTURES];
  vi.stubGlobal("fetch", fetchMock);
  routes();
});

afterEach(() => {
  view?.unmount();
  view = undefined;
  vi.unstubAllGlobals();
});

describe("SegmentsPageClient — list", () => {
  it("renders segments with counts, a system label and delete only for custom ones", async () => {
    listed = [
      ...SEGMENT_FIXTURES.slice(0, 2),
      segmentSummary({ description: "Más de dos viajes" }),
    ];
    const container = await render();

    const headers = Array.from(container.querySelectorAll("thead th")).map((th) => th.textContent);
    expect(headers).toEqual([
      copy.columns.name,
      copy.columns.members,
      copy.columns.subscribed,
      copy.columns.actions,
    ]);

    const waitlist = rowByName(container, "Lista de espera");
    expect(waitlist.querySelector('[data-component="SegmentLabel"]')?.textContent).toBe(
      copy.systemLabel,
    );
    expect(waitlist.textContent).toContain("120");
    expect(waitlist.textContent).toContain("110");
    expect(rowButton(waitlist, copy.actions.edit)).not.toBeNull();
    expect(rowButton(waitlist, copy.actions.delete)).toBeNull();

    const custom = rowByName(container, "Viajeros frecuentes");
    expect(custom.textContent).toContain("Más de dos viajes");
    expect(custom.querySelector('[data-component="SegmentLabel"]')).toBeNull();
    expect(rowButton(custom, copy.actions.delete)).not.toBeNull();
  });

  it("shows the empty state", async () => {
    listed = [];
    const container = await render();
    expect(container.textContent).toContain(copy.empty.title);
  });

  it("shows the load error and retries", async () => {
    let fail = true;
    fetchMock.mockImplementation(async () =>
      fail ? jsonResponse(500, { error: "boom" }) : jsonResponse(200, { segments: listed }),
    );
    const container = await render();
    expect(container.textContent).toContain(copy.errorLoad);

    fail = false;
    await click(buttonByText(container, es.common.tableFilters.retry));
    await flush();
    expect(container.textContent).toContain("Viajeros frecuentes");
  });
});

describe("SegmentsPageClient — create and rename", () => {
  it("creates a segment, shows pending feedback and refreshes the list", async () => {
    const post = deferred<unknown>();
    routes({ [`POST ${SEGMENTS_URL}`]: () => post.promise });
    const container = await render();

    await click(buttonByText(container, copy.newSegment));
    expect(dialog()?.textContent).toContain(copy.form.createTitle);
    await act(async () => {
      setValue(dialogField<HTMLInputElement>("email-segment-name"), "  VIP ");
      setValue(dialogField<HTMLTextAreaElement>("email-segment-description"), " Mejores clientes ");
    });
    await click(dialogButton(copy.form.create));
    await click(dialogButton(copy.form.creating));

    expect(callsTo(`POST ${SEGMENTS_URL}`)).toHaveLength(1);
    const [, init] = callsTo(`POST ${SEGMENTS_URL}`)[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      description: "Mejores clientes",
      name: "VIP",
    });
    expect(dialogButton(copy.form.creating)?.getAttribute("aria-busy")).toBe("true");

    const created = segmentSummary({ id: "seg-vip", memberCount: 0, name: "VIP", subscribedCount: 0 });
    listed = [...listed, created];
    post.resolve(jsonResponse(201, { segment: created }));
    await flush();

    expect(dialog()).toBeNull();
    expect(container.textContent).toContain(copy.feedback.created);
    expect(rowByName(container, "VIP")).toBeDefined();
  });

  it("requires a name before posting", async () => {
    const container = await render();
    await click(buttonByText(container, copy.newSegment));
    await click(dialogButton(copy.form.create));

    expect(callsTo(`POST ${SEGMENTS_URL}`)).toHaveLength(0);
    expect(dialog()?.textContent).toContain(copy.form.errors.nameRequired);
  });

  it("keeps the modal open with a duplicate-name error on 409", async () => {
    routes({
      [`POST ${SEGMENTS_URL}`]: () => jsonResponse(409, { error: "duplicate_segment" }),
    });
    const container = await render();
    await click(buttonByText(container, copy.newSegment));
    setValue(dialogField<HTMLInputElement>("email-segment-name"), "lista de espera");
    await click(dialogButton(copy.form.create));
    await flush();

    expect(dialog()?.textContent).toContain(copy.form.errors.duplicate);
    expect(dialogButton(copy.form.create)?.disabled).toBe(false);
  });

  it("renames a system segment with a PATCH", async () => {
    routes({
      [`PATCH ${SEGMENTS_URL}/seg_waitlist`]: () =>
        jsonResponse(200, { segment: { ...SEGMENT_FIXTURES[0], name: "Espera" } }),
    });
    const container = await render();

    await click(rowButton(rowByName(container, "Lista de espera"), copy.actions.edit));
    expect(dialog()?.textContent).toContain(copy.form.editTitle);
    expect(dialog()?.textContent).toContain(copy.form.systemHint);
    expect(dialogField<HTMLInputElement>("email-segment-name").value).toBe("Lista de espera");
    setValue(dialogField<HTMLInputElement>("email-segment-name"), "Espera");
    await click(dialogButton(copy.form.save));
    await flush();

    const [, init] = callsTo(`PATCH ${SEGMENTS_URL}/seg_waitlist`)[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ description: null, name: "Espera" });
    expect(dialog()).toBeNull();
    expect(container.textContent).toContain(copy.feedback.saved);
  });
});

describe("SegmentsPageClient — delete", () => {
  it("deletes a custom segment only after confirmation", async () => {
    routes({ [`DELETE ${SEGMENTS_URL}/seg-custom`]: () => jsonResponse(200, { ok: true }) });
    const container = await render();

    await click(rowButton(rowByName(container, "Viajeros frecuentes"), copy.actions.delete));
    expect(callsTo(`DELETE ${SEGMENTS_URL}/seg-custom`)).toHaveLength(0);
    expect(dialog()?.textContent).toContain(
      copy.delete.body.replace("{name}", "Viajeros frecuentes"),
    );

    listed = SEGMENT_FIXTURES.slice(0, 2);
    await click(dialogButton(copy.delete.confirm));
    await flush();

    expect(callsTo(`DELETE ${SEGMENTS_URL}/seg-custom`)).toHaveLength(1);
    expect(dialog()).toBeNull();
    expect(container.textContent).not.toContain("Viajeros frecuentes");
    expect(container.textContent).toContain(copy.feedback.deleted);
  });

  it.each([
    ["segment_in_use", copy.delete.errors.inUse],
    ["system_segment", copy.delete.errors.system],
  ])("maps a 409 %s to localized copy and keeps the dialog open", async (code, message) => {
    routes({ [`DELETE ${SEGMENTS_URL}/seg-custom`]: () => jsonResponse(409, { error: code }) });
    const container = await render();

    await click(rowButton(rowByName(container, "Viajeros frecuentes"), copy.actions.delete));
    await click(dialogButton(copy.delete.confirm));
    await flush();

    expect(dialog()?.querySelector('[role="alert"]')?.textContent).toBe(message);
    expect(dialogButton(copy.delete.confirm)?.disabled).toBe(false);
  });
});
