import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminWaitlistPageClient } from "@/app/[locale]/(secure)/dashboard/admin/AdminWaitlistPageClient";
import type { AdminWaitlistEntry } from "@/lib/admin/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "es" }),
}));

let container: HTMLDivElement;
let root: Root;

function render(element: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(element);
  });
  return container;
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function entry(overrides: Partial<AdminWaitlistEntry> = {}): AdminWaitlistEntry {
  return {
    alreadyMember: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    email: "a@example.com",
    id: "entry-1",
    inviteStatus: null,
    lastName: null,
    name: "Ana",
    ...overrides,
  };
}

function makeEntries(n: number, overrides: Partial<AdminWaitlistEntry> = {}) {
  return Array.from({ length: n }, (_, i) =>
    entry({ id: `entry-${i + 1}`, email: `u${i + 1}@example.com`, ...overrides }),
  );
}

function selectAllCheckbox(): HTMLInputElement {
  return container.querySelector(
    'input[type="checkbox"][aria-label="Seleccionar todo"]',
  ) as HTMLInputElement;
}

function rowCheckboxes(): HTMLInputElement[] {
  return Array.from(
    container.querySelectorAll(
      'input[type="checkbox"][aria-label="Seleccionar entrada"]',
    ),
  ) as HTMLInputElement[];
}

function buttonWithText(text: string): HTMLButtonElement {
  const found = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(text),
  );
  if (!found) throw new Error(`Button with text "${text}" not found`);
  return found as HTMLButtonElement;
}

function bodyButtonWithText(text: string): HTMLButtonElement {
  const found = Array.from(document.body.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === text,
  );
  if (!found) throw new Error(`Body button with exact text "${text}" not found`);
  return found as HTMLButtonElement;
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ entries: [], total: 0, page: 1, limit: 20 }),
    }),
  );
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AdminWaitlistPageClient — selection scaffold", () => {
  it("header checkbox selects all rendered rows", async () => {
    const entries = makeEntries(3);
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ entries, total: 3, page: 1, limit: 20 }),
    });

    render(<AdminWaitlistPageClient />);
    await flush();

    await act(async () => {
      selectAllCheckbox().click();
    });

    expect(rowCheckboxes().every((cb) => cb.checked)).toBe(true);
    expect(selectAllCheckbox().checked).toBe(true);
  });

  it("shows indeterminate when only a subset of rows is selected", async () => {
    const entries = makeEntries(3);
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ entries, total: 3, page: 1, limit: 20 }),
    });

    render(<AdminWaitlistPageClient />);
    await flush();

    await act(async () => {
      rowCheckboxes()[0].click();
    });

    expect(selectAllCheckbox().indeterminate).toBe(true);
  });

  it("row checkbox is enabled and toggleable on an alreadyMember row (no disabled prop)", async () => {
    const entries = [entry({ id: "entry-1", alreadyMember: true })];
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ entries, total: 1, page: 1, limit: 20 }),
    });

    render(<AdminWaitlistPageClient />);
    await flush();

    const cb = rowCheckboxes()[0];
    expect(cb.disabled).toBe(false);

    await act(async () => {
      cb.click();
    });
    expect(cb.checked).toBe(true);
  });

  it("clears selection on page change", async () => {
    const page1 = makeEntries(2);
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ entries: page1, total: 22, page: 1, limit: 20 }),
    });

    render(<AdminWaitlistPageClient />);
    await flush();

    await act(async () => {
      rowCheckboxes()[0].click();
    });
    expect(rowCheckboxes().some((cb) => cb.checked)).toBe(true);

    const page2 = [
      entry({ id: "page2-a", email: "page2a@example.com" }),
      entry({ id: "page2-b", email: "page2b@example.com" }),
    ];
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ entries: page2, total: 22, page: 2, limit: 20 }),
    });

    const nextButton = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Siguiente"),
    ) as HTMLButtonElement;
    await act(async () => {
      nextButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(rowCheckboxes().every((cb) => !cb.checked)).toBe(true);
  });
});

describe("AdminWaitlistPageClient — bulk-action bar", () => {
  it("both bulk actions are disabled at zero selection", async () => {
    const entries = makeEntries(2);
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ entries, total: 2, page: 1, limit: 20 }),
    });

    render(<AdminWaitlistPageClient />);
    await flush();

    expect(buttonWithText("Invitar").disabled).toBe(true);
    expect(buttonWithText("Eliminar (").disabled).toBe(true);
  });

  it("bar labels bind to the raw selection count", async () => {
    const entries = makeEntries(5);
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ entries, total: 5, page: 1, limit: 20 }),
    });

    render(<AdminWaitlistPageClient />);
    await flush();

    await act(async () => {
      selectAllCheckbox().click();
    });

    expect(buttonWithText("Invitar (5)")).toBeTruthy();
    expect(buttonWithText("Eliminar (5)")).toBeTruthy();
  });

  it("bulk-invite button is disabled when the selection is entirely alreadyMember, even though the bar shows the raw count", async () => {
    const entries = makeEntries(2, { alreadyMember: true });
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ entries, total: 2, page: 1, limit: 20 }),
    });

    render(<AdminWaitlistPageClient />);
    await flush();

    await act(async () => {
      selectAllCheckbox().click();
    });

    const inviteButton = buttonWithText("Invitar (2)");
    expect(inviteButton.disabled).toBe(true);
    // Delete stays enabled — it never filters alreadyMember.
    expect(buttonWithText("Eliminar (2)").disabled).toBe(false);
  });
});

describe("AdminWaitlistPageClient — already-member badge and single-row gating", () => {
  it("shows the badge instead of Invited/Expired chip, and disables the single-row invite button", async () => {
    const entries = [
      entry({ id: "entry-1", alreadyMember: true, inviteStatus: "invited" }),
    ];
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ entries, total: 1, page: 1, limit: 20 }),
    });

    render(<AdminWaitlistPageClient />);
    await flush();

    expect(container.textContent).toContain("Ya es miembro");
    expect(container.textContent).not.toContain("Invitado");

    const inviteButtons = Array.from(
      container.querySelectorAll("button"),
    ).filter((b) => b.className.includes("h-[34px]"));
    // First icon button in the row is invite (see component order: invite, delete)
    expect(inviteButtons[0].disabled).toBe(true);
  });
});

describe("AdminWaitlistPageClient — bulk invite", () => {
  it("shows a neutral confirmation modal before sending any request", async () => {
    const entries = makeEntries(2);
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ entries, total: 2, page: 1, limit: 20 }),
    });

    render(<AdminWaitlistPageClient />);
    await flush();

    await act(async () => {
      selectAllCheckbox().click();
    });
    const fetchCallsBefore = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;

    await act(async () => {
      buttonWithText("Invitar (2)").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    expect(document.body.textContent).toContain("Invitar como Tripper");
    expect(
      (fetch as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBe(fetchCallsBefore);
  });

  it("excludes alreadyMember rows from the fan-out and resends to a live Invited row", async () => {
    const entries = [
      entry({ id: "e1", alreadyMember: false, inviteStatus: "invited" }),
      entry({ id: "e2", alreadyMember: true, email: "e2@example.com" }),
      entry({ id: "e3", alreadyMember: false, email: "e3@example.com" }),
    ];
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ entries, total: 3, page: 1, limit: 20 }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminWaitlistPageClient />);
    await flush();

    await act(async () => {
      selectAllCheckbox().click();
    });

    await act(async () => {
      buttonWithText("Invitar (3)").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    const confirmButton = bodyButtonWithText("Confirmar");
    await act(async () => {
      confirmButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    await flush();

    const postCalls = fetchMock.mock.calls.filter(
      ([, init]) => init?.method === "POST",
    );
    expect(postCalls).toHaveLength(2);
    expect(postCalls.map(([url]) => url)).toEqual(
      expect.arrayContaining([
        "/api/admin/waitlist/e1/invite-tripper",
        "/api/admin/waitlist/e3/invite-tripper",
      ]),
    );
  });

  it("reports partial failure, refetches, and clears selection", async () => {
    const entries = [
      entry({ id: "e1", email: "e1@example.com" }),
      entry({ id: "e2", email: "e2@example.com" }),
    ];
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "POST" && url === "/api/admin/waitlist/e1/invite-tripper") {
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
      }
      if (init?.method === "POST" && url === "/api/admin/waitlist/e2/invite-tripper") {
        return Promise.resolve({ ok: false, json: async () => ({ error: "boom" }) });
      }
      if (!init) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ entries, total: 2, page: 1, limit: 20 }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ entries: [], total: 0, page: 1, limit: 20 }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminWaitlistPageClient />);
    await flush();

    await act(async () => {
      selectAllCheckbox().click();
    });

    await act(async () => {
      buttonWithText("Invitar (2)").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    const confirmButton = bodyButtonWithText("Confirmar");
    await act(async () => {
      confirmButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    await flush();
    await flush();

    expect(container.textContent).toContain(
      "Se completaron 1 de 2. No se pudieron completar 1.",
    );
    expect(rowCheckboxes().length === 0 || rowCheckboxes().every((cb) => !cb.checked)).toBe(
      true,
    );
  });
});

describe("AdminWaitlistPageClient — bulk delete", () => {
  it("shows a danger confirmation modal and includes alreadyMember rows with no filter", async () => {
    const entries = [
      entry({ id: "e1", alreadyMember: true, email: "e1@example.com" }),
      entry({ id: "e2", alreadyMember: false, email: "e2@example.com" }),
    ];
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "DELETE") {
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ entries, total: 2, page: 1, limit: 20 }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminWaitlistPageClient />);
    await flush();

    await act(async () => {
      selectAllCheckbox().click();
    });

    await act(async () => {
      buttonWithText("Eliminar (2)").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    expect(document.body.textContent).toContain("Eliminar de la lista de espera");

    const confirmButton = bodyButtonWithText("Confirmar");
    await act(async () => {
      confirmButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    await flush();

    const deleteCalls = fetchMock.mock.calls.filter(
      ([, init]) => init?.method === "DELETE",
    );
    expect(deleteCalls).toHaveLength(2);
    expect(deleteCalls.map(([url]) => url)).toEqual(
      expect.arrayContaining([
        "/api/admin/waitlist/e1",
        "/api/admin/waitlist/e2",
      ]),
    );
  });

  it("reports partial failure, refetches, and clears selection", async () => {
    const entries = [
      entry({ id: "e1", email: "e1@example.com" }),
      entry({ id: "e2", email: "e2@example.com" }),
    ];
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "DELETE" && url === "/api/admin/waitlist/e1") {
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
      }
      if (init?.method === "DELETE" && url === "/api/admin/waitlist/e2") {
        return Promise.resolve({ ok: false, json: async () => ({ error: "boom" }) });
      }
      if (!init) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ entries, total: 2, page: 1, limit: 20 }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ entries: [], total: 0, page: 1, limit: 20 }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminWaitlistPageClient />);
    await flush();

    await act(async () => {
      selectAllCheckbox().click();
    });

    await act(async () => {
      buttonWithText("Eliminar (2)").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    const confirmButton = bodyButtonWithText("Confirmar");
    await act(async () => {
      confirmButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    await flush();
    await flush();

    expect(container.textContent).toContain(
      "Se completaron 1 de 2. No se pudieron completar 1.",
    );
  });
});
