import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import { ContactsPageClient } from "@/components/app/admin/email-campaigns/ContactsPageClient";
import type { Contact } from "@/types/emailCampaign";
import { chipByLabel, stubFetchWithSegments } from "./emailCampaignsTestUtils";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "es" }),
  useRouter: () => ({ push }),
}));

const copy = es.adminPages.emailCampaigns.contacts;
const filterCopy = es.common.tableFilters;

let container: HTMLDivElement;
let root: Root;

function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<ContactsPageClient />);
  });
}

async function flush() {
  await act(async () => {
    for (let i = 0; i < 5; i += 1) await Promise.resolve();
  });
}

function contact(overrides: Partial<Contact> = {}): Contact {
  return {
    createdAt: "2026-06-18T00:00:00.000Z",
    email: "ana@example.com",
    id: "c-1",
    locale: "es",
    name: "Ana",
    source: "FRIENDS_FAMILY",
    status: "SUBSCRIBED",
    tags: [],
    segments: [],
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function listResponse(items: Contact[], total = items.length) {
  return jsonResponse({ items, total, page: 1, limit: 20 });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

const fetchMock = vi.fn();

function calls(method: string) {
  return fetchMock.mock.calls.filter(
    ([, init]) => ((init as RequestInit | undefined)?.method ?? "GET") === method,
  );
}

function setValue(element: HTMLInputElement | HTMLSelectElement, value: string) {
  const proto =
    element instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(element, value);
  element.dispatchEvent(
    new Event(element instanceof HTMLSelectElement ? "change" : "input", {
      bubbles: true,
    }),
  );
}

function field<T extends HTMLElement>(id: string): T {
  const found = container.querySelector(`#${id}`);
  if (!found) throw new Error(`Field #${id} not found`);
  return found as T;
}

function submitButton(): HTMLButtonElement {
  return container.querySelector(
    '[data-component="AddContactForm"] button[type="submit"]',
  ) as HTMLButtonElement;
}

function resubscribeButton(): HTMLButtonElement | null {
  return container.querySelector(
    `button[aria-label="${copy.actions.resubscribe}"], button[aria-label="${copy.actions.resubscribing}"]`,
  );
}

beforeEach(() => {
  push.mockReset();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(listResponse([]));
  stubFetchWithSegments(fetchMock);
});

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});

describe("ContactsPageClient — list", () => {
  it("renders rows, status badges, filters and the result count", async () => {
    fetchMock.mockResolvedValue(
      listResponse(
        [
          contact(),
          contact({
            email: "beto@example.com",
            id: "c-2",
            name: null,
            source: "WAITLIST",
            status: "BOUNCED",
          }),
        ],
        7,
      ),
    );
    render();
    await flush();

    const text = container.textContent ?? "";
    expect(text).toContain("ana@example.com");
    expect(text).toContain("beto@example.com");
    expect(text).toContain(copy.source.FRIENDS_FAMILY);
    expect(text).toContain(copy.source.WAITLIST);
    const badges = Array.from(
      container.querySelectorAll('[data-component="StatusIndicatorBadge"]'),
    ).map((badge) => badge.textContent);
    expect(badges).toEqual([copy.status.SUBSCRIBED, copy.status.BOUNCED]);
    expect(field<HTMLSelectElement>("email-contacts-source")).toBeTruthy();
    expect(field<HTMLSelectElement>("email-contacts-status")).toBeTruthy();
    expect(field<HTMLInputElement>("email-contacts-search")).toBeTruthy();
    expect(text).toContain(`2 ${filterCopy.of} 7 ${filterCopy.count}`);
  });

  it("refetches with the selected source filter", async () => {
    render();
    await flush();

    await act(async () => {
      setValue(field<HTMLSelectElement>("email-contacts-source"), "WAITLIST");
    });
    await flush();

    const lastUrl = String(calls("GET").at(-1)?.[0]);
    expect(lastUrl).toContain("/api/admin/email-campaigns/contacts?");
    expect(lastUrl).toContain("source=WAITLIST");
    expect(lastUrl).toContain("page=1");
  });

  it("shows each contact's segments and filters by segment id", async () => {
    fetchMock.mockResolvedValue(
      listResponse([
        contact({
          segments: [
            { id: "seg_friends_family", name: "Amigos y familia", systemKey: "FRIENDS_FAMILY" },
            { id: "seg-custom", name: "Viajeros frecuentes", systemKey: null },
          ],
        }),
      ]),
    );
    render();
    await flush();

    const headers = Array.from(container.querySelectorAll("thead th")).map((th) => th.textContent);
    expect(headers).toContain(copy.columns.segments);
    const labels = Array.from(
      container.querySelectorAll('tbody [data-component="SegmentLabel"]'),
    ).map((label) => label.textContent);
    expect(labels).toEqual(["Amigos y familia", "Viajeros frecuentes"]);

    const select = field<HTMLSelectElement>("email-contacts-segment");
    expect(Array.from(select.options).map((option) => option.textContent)).toEqual([
      copy.filters.allSegments,
      "Lista de espera",
      "Amigos y familia",
      "Viajeros frecuentes",
    ]);
    await act(async () => {
      setValue(select, "seg-custom");
    });
    await flush();

    const lastUrl = String(calls("GET").at(-1)?.[0]);
    expect(lastUrl).toContain("segmentId=seg-custom");
    expect(lastUrl).toContain("page=1");
  });

  it("shows the empty state microcopy", async () => {
    render();
    await flush();
    expect(container.textContent).toContain(copy.empty);
  });

  it("shows the load error with a retry", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "boom" }, 500));
    render();
    await flush();
    expect(container.textContent).toContain(copy.errorLoad);
  });
});

describe("ContactsPageClient — add friends & family", () => {
  async function fillAndSubmit(email: string) {
    await act(async () => {
      setValue(field<HTMLInputElement>("email-contact-email"), email);
      setValue(field<HTMLInputElement>("email-contact-name"), "Carla");
      setValue(field<HTMLInputElement>("email-contact-tags"), "vip, familia ,");
    });
    await act(async () => {
      submitButton().click();
    });
    await flush();
  }

  it("posts the contact, confirms and refreshes the list", async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === "POST"
        ? jsonResponse({ contact: contact({ id: "c-9" }) }, 201)
        : listResponse([]),
    );
    render();
    await flush();
    const getsBefore = calls("GET").length;

    await fillAndSubmit("Carla@Example.com");

    const [url, init] = calls("POST")[0] ?? [];
    expect(url).toBe("/api/admin/email-campaigns/contacts");
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({
      email: "Carla@Example.com",
      locale: "es",
      name: "Carla",
      tags: ["vip", "familia"],
    });
    expect(container.textContent).toContain(copy.form.success);
    expect(container.textContent).toContain(copy.form.segmentsHint);
    expect(calls("GET").length).toBeGreaterThan(getsBefore);
    expect(field<HTMLInputElement>("email-contact-email").value).toBe("");
  });

  it("offers extra segments without the friends & family one and posts the picked ids", async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === "POST"
        ? jsonResponse({ contact: contact({ id: "c-9" }) }, 201)
        : listResponse([]),
    );
    render();
    await flush();

    const form = container.querySelector('[data-component="AddContactForm"]') as HTMLElement;
    expect(chipByLabel(form, "Amigos y familia")).toBeUndefined();
    await act(async () => {
      chipByLabel(form, "Viajeros frecuentes")?.click();
    });
    await fillAndSubmit("nuevo@example.com");

    const [, init] = calls("POST")[0] ?? [];
    expect(JSON.parse(String((init as RequestInit).body)).segmentIds).toEqual(["seg-custom"]);
    expect(chipByLabel(form, "Viajeros frecuentes")?.getAttribute("aria-pressed")).toBe("false");
  });

  it("shows the duplicate message on 409", async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === "POST"
        ? jsonResponse({ error: "duplicate_email" }, 409)
        : listResponse([]),
    );
    render();
    await flush();

    await fillAndSubmit("ana@example.com");

    expect(container.textContent).toContain(copy.form.errors.duplicate);
    expect(field<HTMLInputElement>("email-contact-email").value).toBe(
      "ana@example.com",
    );
  });

  it("validates the email before posting", async () => {
    render();
    await flush();

    await fillAndSubmit("not-an-email");

    expect(calls("POST")).toHaveLength(0);
    expect(container.textContent).toContain(copy.form.errors.invalidEmail);
  });

  it("shows the server validation message on 400", async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === "POST"
        ? jsonResponse({ error: "Invalid input" }, 400)
        : listResponse([]),
    );
    render();
    await flush();

    await fillAndSubmit("ana@example.com");

    expect(container.textContent).toContain(copy.form.errors.invalid);
  });

  it("shows a pending state and ignores duplicate submits", async () => {
    const post = deferred<ReturnType<typeof jsonResponse>>();
    fetchMock.mockImplementation((_url: string, init?: RequestInit) =>
      init?.method === "POST" ? post.promise : Promise.resolve(listResponse([])),
    );
    render();
    await flush();

    await act(async () => {
      setValue(field<HTMLInputElement>("email-contact-email"), "new@example.com");
    });
    await act(async () => {
      submitButton().click();
      submitButton().click();
    });

    expect(calls("POST")).toHaveLength(1);
    expect(submitButton().getAttribute("aria-busy")).toBe("true");
    expect(submitButton().disabled).toBe(true);
    expect(submitButton().textContent).toContain(copy.form.submitting);

    post.resolve(jsonResponse({ contact: contact() }, 201));
    await flush();

    expect(submitButton().getAttribute("aria-busy")).toBe("false");
    expect(submitButton().textContent).toContain(copy.form.submit);
  });
});

describe("ContactsPageClient — resubscribe", () => {
  it("shows a pending state, guards duplicates and updates the row", async () => {
    const patch = deferred<ReturnType<typeof jsonResponse>>();
    fetchMock.mockImplementation((_url: string, init?: RequestInit) =>
      init?.method === "PATCH"
        ? patch.promise
        : Promise.resolve(
            listResponse([contact({ id: "c-3", status: "UNSUBSCRIBED" })]),
          ),
    );
    render();
    await flush();

    expect(resubscribeButton()?.getAttribute("aria-label")).toBe(
      copy.actions.resubscribe,
    );
    await act(async () => {
      resubscribeButton()?.click();
    });
    await act(async () => {
      resubscribeButton()?.click();
    });

    expect(calls("PATCH")).toHaveLength(1);
    const [url, init] = calls("PATCH")[0] ?? [];
    expect(url).toBe("/api/admin/email-campaigns/contacts/c-3");
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({
      status: "SUBSCRIBED",
    });
    expect(resubscribeButton()?.getAttribute("aria-busy")).toBe("true");
    expect(resubscribeButton()?.getAttribute("aria-label")).toBe(
      copy.actions.resubscribing,
    );
    expect(resubscribeButton()?.disabled).toBe(true);

    patch.resolve(
      jsonResponse({ contact: contact({ id: "c-3", status: "SUBSCRIBED" }) }),
    );
    await flush();

    expect(resubscribeButton()).toBeNull();
    expect(
      container.querySelector('[data-component="StatusIndicatorBadge"]')
        ?.textContent,
    ).toBe(copy.status.SUBSCRIBED);
  });

  it("shows an error and allows retry after a failed resubscribe", async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === "PATCH"
        ? jsonResponse({ error: "boom" }, 500)
        : listResponse([contact({ id: "c-4", status: "BOUNCED" })]),
    );
    render();
    await flush();

    await act(async () => {
      resubscribeButton()?.click();
    });
    await flush();

    expect(container.textContent).toContain(copy.actions.resubscribeError);
    expect(resubscribeButton()?.disabled).toBe(false);
    expect(resubscribeButton()?.getAttribute("aria-label")).toBe(
      copy.actions.resubscribe,
    );
  });
});

describe("ContactsPageClient — edit", () => {
  function editButton(): HTMLButtonElement | null {
    return container.querySelector(`button[aria-label="${copy.actions.edit}"]`);
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

  const editable = contact({
    id: "c-5",
    segments: [{ id: "seg_friends_family", name: "Amigos y familia", systemKey: "FRIENDS_FAMILY" }],
  });

  it("edits name, language and segments and updates the row", async () => {
    const patch = deferred<ReturnType<typeof jsonResponse>>();
    fetchMock.mockImplementation((_url: string, init?: RequestInit) =>
      init?.method === "PATCH" ? patch.promise : Promise.resolve(listResponse([editable])),
    );
    render();
    await flush();

    await act(async () => {
      editButton()?.click();
    });
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain(copy.edit.title);
    expect(dialogField<HTMLInputElement>("email-contact-edit-name").value).toBe("Ana");
    expect(chipByLabel(dialog, "Amigos y familia")?.getAttribute("aria-pressed")).toBe("true");

    await act(async () => {
      setValue(dialogField<HTMLInputElement>("email-contact-edit-name"), "  Ana María ");
      setValue(dialogField<HTMLSelectElement>("email-contact-edit-locale"), "en");
    });
    await act(async () => {
      chipByLabel(dialog, "Viajeros frecuentes")?.click();
    });
    await act(async () => {
      dialogButton(copy.edit.save)?.click();
    });
    await act(async () => {
      dialogButton(copy.edit.saving)?.click();
    });

    expect(calls("PATCH")).toHaveLength(1);
    const [url, init] = calls("PATCH")[0] ?? [];
    expect(url).toBe("/api/admin/email-campaigns/contacts/c-5");
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({
      locale: "en",
      name: "Ana María",
      segmentIds: ["seg_friends_family", "seg-custom"],
    });
    expect(dialogButton(copy.edit.saving)?.getAttribute("aria-busy")).toBe("true");

    patch.resolve(
      jsonResponse({
        contact: contact({
          ...editable,
          locale: "en",
          name: "Ana María",
          segments: [
            { id: "seg_friends_family", name: "Amigos y familia", systemKey: "FRIENDS_FAMILY" },
            { id: "seg-custom", name: "Viajeros frecuentes", systemKey: null },
          ],
        }),
      }),
    );
    await flush();

    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(container.textContent).toContain("Ana María");
    expect(container.textContent).toContain("Viajeros frecuentes");
    expect(container.textContent).toContain(copy.edit.saved);
  });

  it("shows a localized error for a stale segment and allows retry", async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === "PATCH"
        ? jsonResponse({ error: "invalid_segment" }, 400)
        : listResponse([editable]),
    );
    render();
    await flush();

    await act(async () => {
      editButton()?.click();
    });
    await act(async () => {
      dialogButton(copy.edit.save)?.click();
    });
    await flush();

    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain(copy.edit.errors.invalidSegment);
    expect(dialogButton(copy.edit.save)?.disabled).toBe(false);
  });
});
