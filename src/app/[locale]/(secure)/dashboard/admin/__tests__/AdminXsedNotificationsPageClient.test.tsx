import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminXsedNotificationsPageClient } from "@/app/[locale]/(secure)/dashboard/admin/AdminXsedNotificationsPageClient";
import type { AdminXsedNotificationEntry } from "@/lib/admin/types";

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

function fetchMock() {
  return fetch as unknown as ReturnType<typeof vi.fn>;
}

function entry(
  overrides: Partial<AdminXsedNotificationEntry> = {},
): AdminXsedNotificationEntry {
  return {
    createdAt: "2026-01-01T00:00:00.000Z",
    email: "a@b.com",
    id: "n1",
    locale: "es",
    ...overrides,
  } as AdminXsedNotificationEntry;
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ entries: [entry()], total: 25 }),
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

describe("AdminXsedNotificationsPageClient — refetch keeps chrome mounted and dims the panel", () => {
  it("sets aria-busy on the panel during a page-change refetch without unmounting the count label", async () => {
    render(<AdminXsedNotificationsPageClient />);
    await flush();

    const panel = container.querySelector("[aria-busy]") as HTMLElement;
    expect(panel.getAttribute("aria-busy")).toBe("false");

    let resolveFetch: (value: unknown) => void = () => {};
    fetchMock().mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const nextButton = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Siguiente"),
    ) as HTMLButtonElement;

    act(() => {
      nextButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(panel.getAttribute("aria-busy")).toBe("true");
    expect(container.textContent).toContain("25 notificaciones XSED");
    expect(container.querySelector("tbody")?.textContent).toContain("a@b.com");
    expect(container.querySelector("[aria-busy]")).toBe(panel);

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({ entries: [entry()], total: 25 }),
      });
      await Promise.resolve();
    });
    await flush();

    const settledPanel = container.querySelector("[aria-busy]") as HTMLElement;
    expect(settledPanel.getAttribute("aria-busy")).toBe("false");
  });
});

describe("AdminXsedNotificationsPageClient — refetch error keeps chrome mounted", () => {
  it("shows an inline banner without unmounting pagination", async () => {
    render(<AdminXsedNotificationsPageClient />);
    await flush();

    fetchMock().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Refetch boom" }),
    });

    const nextButton = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Siguiente"),
    ) as HTMLButtonElement;
    await act(async () => {
      nextButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    await flush();

    const banner = container.querySelector('[role="alert"]');
    expect(banner?.textContent).toContain("Refetch boom");
    expect(container.querySelector("tbody")?.textContent).toContain("a@b.com");
    expect(
      container.querySelector("[aria-busy]")?.getAttribute("aria-busy"),
    ).toBe("false");
    expect(
      Array.from(container.querySelectorAll("button")).some((b) =>
        b.textContent?.includes("Siguiente"),
      ),
    ).toBe(true);
    const retry = deferredResponse();
    fetchMock().mockReturnValueOnce(retry.promise);
    changePage("Anterior");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(
      container.querySelector("[aria-busy]")?.getAttribute("aria-busy"),
    ).toBe("true");
    retry.resolve(pageResponse("recovered@example.com"));
    await flush();
    expect(container.querySelector("tbody")?.textContent).toContain(
      "recovered@example.com",
    );
  });
});

function deferredResponse() {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function changePage(label: string) {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.includes(label),
  )!;
  act(() => button.click());
}

function pageResponse(email: string, total = 25) {
  return {
    ok: true,
    json: async () => ({ entries: [entry({ email })], total }),
  };
}

it.each(["success", "http error", "network error"])(
  "ignores obsolete %s before and after the repeated page settles (A→B→A)",
  async (outcome) => {
    render(<AdminXsedNotificationsPageClient />);
    await flush();
    const oldA = deferredResponse();
    const oldB = deferredResponse();
    const currentA = deferredResponse();
    fetchMock()
      .mockReturnValueOnce(oldA.promise)
      .mockReturnValueOnce(oldB.promise)
      .mockReturnValueOnce(currentA.promise);
    changePage("Siguiente");
    changePage("Anterior");
    changePage("Siguiente");

    function settleObsolete(request: ReturnType<typeof deferredResponse>) {
      if (outcome === "network error")
        request.reject(new Error("Obsolete error"));
      else
        request.resolve(
          outcome === "http error"
            ? { ok: false, json: async () => ({ error: "Obsolete error" }) }
            : pageResponse("obsolete@example.com", 99),
        );
    }
    settleObsolete(oldA);
    await flush();
    expect(
      container.querySelector("[aria-busy]")?.getAttribute("aria-busy"),
    ).toBe("true");
    expect(container.querySelector("tbody")?.textContent).toContain("a@b.com");
    currentA.resolve(pageResponse("current@example.com", 30));
    await flush();
    settleObsolete(oldB);
    await flush();
    expect(container.querySelector("tbody")?.textContent).toContain(
      "current@example.com",
    );
    expect(container.textContent).toContain("30 notificaciones XSED");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(
      container.querySelector("[aria-busy]")?.getAttribute("aria-busy"),
    ).toBe("false");
  },
);

it.each(["http", "network"])(
  "settles an initial %s failure into the inline error and empty panel",
  async (kind) => {
    if (kind === "http")
      fetchMock().mockResolvedValue({ ok: false, json: async () => ({}) });
    else fetchMock().mockRejectedValue(new Error("offline"));
    render(<AdminXsedNotificationsPageClient />);
    await flush();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      "Error al cargar las notificaciones XSED",
    );
    expect(container.textContent).toContain(
      "No se encontraron notificaciones XSED.",
    );
    expect(container.textContent).toContain("0 notificaciones XSED");
    expect(
      container.querySelector("[aria-busy]")?.getAttribute("aria-busy"),
    ).toBe("false");
  },
);

it("keeps pending until the response body completes", async () => {
  render(<AdminXsedNotificationsPageClient />);
  await flush();
  const body = deferredResponse();
  fetchMock().mockResolvedValue({ ok: true, json: () => body.promise });
  changePage("Siguiente");
  await flush();
  expect(
    container.querySelector("[aria-busy]")?.getAttribute("aria-busy"),
  ).toBe("true");
  body.resolve({
    entries: [entry({ email: "parsed@example.com" })],
    total: 25,
  });
  await flush();
  expect(container.querySelector("tbody")?.textContent).toContain(
    "parsed@example.com",
  );
  expect(
    container.querySelector("[aria-busy]")?.getAttribute("aria-busy"),
  ).toBe("false");
});

it("aborts an unmounted request without affecting a new mount", async () => {
  const abandoned = deferredResponse();
  fetchMock().mockReturnValueOnce(abandoned.promise);
  render(<AdminXsedNotificationsPageClient />);
  const signal = fetchMock().mock.calls[0][1].signal as AbortSignal;
  act(() => root.render(<></>));
  expect(signal.aborted).toBe(true);
  act(() => root.render(<AdminXsedNotificationsPageClient />));
  await flush();
  abandoned.resolve(pageResponse("abandoned@example.com", 99));
  await flush();
  expect(container.querySelector("tbody")?.textContent).toContain("a@b.com");
  expect(container.textContent).toContain("25 notificaciones XSED");
});

it("settles the live request after StrictMode setup/cleanup replay", async () => {
  const discarded = deferredResponse();
  fetchMock().mockReturnValueOnce(discarded.promise);
  render(
    <StrictMode>
      <AdminXsedNotificationsPageClient />
    </StrictMode>,
  );
  await flush();
  expect((fetchMock().mock.calls[0][1].signal as AbortSignal).aborted).toBe(
    true,
  );
  discarded.reject(new Error("discarded"));
  await flush();
  expect(container.querySelector("tbody")?.textContent).toContain("a@b.com");
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(
    container.querySelector("[aria-busy]")?.getAttribute("aria-busy"),
  ).toBe("false");
});

it("deletes locally without starting another GET", async () => {
  render(<AdminXsedNotificationsPageClient />);
  await flush();
  fetchMock().mockResolvedValue({ ok: true });
  act(() =>
    container.querySelector<HTMLButtonElement>("tbody button")!.click(),
  );
  await flush();
  expect(
    fetchMock().mock.calls.map(([url, options]) => [
      url,
      options?.method ?? "GET",
    ]),
  ).toEqual([
    ["/api/admin/xsed-notifications?page=1&limit=20", "GET"],
    ["/api/admin/xsed-notifications/n1", "DELETE"],
  ]);
  expect(container.textContent).toContain("24 notificaciones XSED");
  expect(container.textContent).toContain(
    "No se encontraron notificaciones XSED.",
  );
});

it("retains the latest repeated page when A→B→A responses arrive fully reversed", async () => {
  render(<AdminXsedNotificationsPageClient />);
  await flush();
  const requests = [deferredResponse(), deferredResponse(), deferredResponse()];
  requests.forEach((request) =>
    fetchMock().mockReturnValueOnce(request.promise),
  );
  changePage("Siguiente");
  changePage("Anterior");
  changePage("Siguiente");
  expect(fetchMock().mock.calls.map(([url]) => url)).toEqual([
    "/api/admin/xsed-notifications?page=1&limit=20",
    "/api/admin/xsed-notifications?page=2&limit=20",
    "/api/admin/xsed-notifications?page=1&limit=20",
    "/api/admin/xsed-notifications?page=2&limit=20",
  ]);
  requests[2].resolve(pageResponse("latest-a@example.com", 30));
  await flush();
  requests[1].resolve(pageResponse("old-b@example.com", 80));
  await flush();
  requests[0].resolve(pageResponse("old-a@example.com", 99));
  await flush();
  expect(container.querySelector("tbody")?.textContent).toContain(
    "latest-a@example.com",
  );
  expect(container.textContent).toContain("30 notificaciones XSED");
  expect(
    container.querySelector("[aria-busy]")?.getAttribute("aria-busy"),
  ).toBe("false");
});
