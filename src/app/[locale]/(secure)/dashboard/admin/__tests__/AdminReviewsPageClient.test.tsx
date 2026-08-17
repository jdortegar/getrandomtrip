import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminReviewsPageClient } from "@/app/[locale]/(secure)/dashboard/admin/AdminReviewsPageClient";

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

function fetchMock() {
  return fetch as unknown as ReturnType<typeof vi.fn>;
}

function lastFetchUrl(): string {
  const calls = fetchMock().mock.calls;
  return calls[calls.length - 1][0] as string;
}

function thWithText(text: string): HTMLTableCellElement {
  const found = Array.from(container.querySelectorAll("th")).find((th) =>
    th.textContent?.includes(text),
  );
  if (!found) throw new Error(`<th> with text "${text}" not found`);
  return found as HTMLTableCellElement;
}

function buttonWithText(text: string): HTMLButtonElement {
  const found = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(text),
  );
  if (!found) throw new Error(`Button with text "${text}" not found`);
  return found as HTMLButtonElement;
}

function setNativeInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function sampleReview() {
  return {
    content: "Great trip",
    createdAt: "2026-01-01T00:00:00.000Z",
    destination: null,
    id: "r1",
    isApproved: true,
    isPublic: true,
    rating: 5,
    title: "",
    tripRequestId: null,
    tripperName: "Some Tripper",
    user: { email: "a@b.com", id: "u1", name: "Ana" },
  };
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reviews: [sampleReview()], total: 1 }),
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
  vi.useRealTimers();
});

describe("AdminReviewsPageClient — default sort state", () => {
  it("first fetch carries sortBy=created&sortOrder=desc with zero extra requests, Created <th> shows aria-sort=descending", async () => {
    render(<AdminReviewsPageClient />);
    await flush();

    expect(fetch).toHaveBeenCalledTimes(1);
    const url = lastFetchUrl();
    expect(url).toContain("sortBy=created");
    expect(url).toContain("sortOrder=desc");

    const createdTh = thWithText("Creado");
    expect(createdTh.getAttribute("aria-sort")).toBe("descending");
  });
});

describe("AdminReviewsPageClient — sortable header inventory", () => {
  it("exactly 4 buttons render inside <thead> — the 4 non-sortable columns have no button and no aria-sort attribute", async () => {
    render(<AdminReviewsPageClient />);
    await flush();

    const thead = container.querySelector("thead") as HTMLElement;
    const buttons = Array.from(thead.querySelectorAll("button"));
    expect(buttons).toHaveLength(4);

    for (const label of ["Reseña", "Estado", "ID de viaje", "Acciones"]) {
      const th = thWithText(label);
      expect(th.querySelector("button")).toBeNull();
      expect(th.hasAttribute("aria-sort")).toBe(false);
    }
  });

  it("aria-sort is 'none' on inactive sortable headers", async () => {
    render(<AdminReviewsPageClient />);
    await flush();

    const ratingTh = thWithText("Calificación");
    expect(ratingTh.getAttribute("aria-sort")).toBe("none");
  });
});

describe("AdminReviewsPageClient — toggling sort", () => {
  it("clicking Tripper fetches sortBy=tripper&sortOrder=asc (first-click default is asc); clicking again flips to desc", async () => {
    render(<AdminReviewsPageClient />);
    await flush();

    await act(async () => {
      buttonWithText("Tripper").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await Promise.resolve();
    });
    await flush();

    let url = lastFetchUrl();
    expect(url).toContain("sortBy=tripper");
    expect(url).toContain("sortOrder=asc");

    await act(async () => {
      buttonWithText("Tripper").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await Promise.resolve();
    });
    await flush();

    url = lastFetchUrl();
    expect(url).toContain("sortBy=tripper");
    expect(url).toContain("sortOrder=desc");
  });
});

describe("AdminReviewsPageClient — sort composes with filter, search, and pagination", () => {
  it("with status=unapproved and a search term active on page 3, clicking a sort header resets to page=1 while status and search persist", async () => {
    vi.useFakeTimers();
    fetchMock().mockResolvedValue({
      ok: true,
      json: async () => ({ reviews: [sampleReview()], total: 100 }),
    });

    render(<AdminReviewsPageClient />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const select = container.querySelector("select") as HTMLSelectElement;
    await act(async () => {
      select.value = "unapproved";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      await vi.advanceTimersByTimeAsync(0);
    });

    const searchInput = container.querySelector(
      'input[type="text"]',
    ) as HTMLInputElement;
    await act(async () => {
      setNativeInputValue(searchInput, "Ana");
      await vi.advanceTimersByTimeAsync(400);
    });

    await act(async () => {
      buttonWithText("Siguiente").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      buttonWithText("Siguiente").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await vi.advanceTimersByTimeAsync(0);
    });

    const preSortUrl = lastFetchUrl();
    expect(preSortUrl).toContain("page=3");
    expect(preSortUrl).toContain("status=unapproved");
    expect(preSortUrl).toContain("search=Ana");

    await act(async () => {
      buttonWithText("Calificación").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await vi.advanceTimersByTimeAsync(0);
    });

    const postSortUrl = lastFetchUrl();
    expect(postSortUrl).toContain("page=1");
    expect(postSortUrl).toContain("status=unapproved");
    expect(postSortUrl).toContain("search=Ana");
    expect(postSortUrl).toContain("sortBy=rating");
  });
});

describe("AdminReviewsPageClient — initial load error (never loaded)", () => {
  it("recovers into an interactive page showing the error, not a dead end", async () => {
    fetchMock().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Boom" }),
    });

    render(<AdminReviewsPageClient />);
    await flush();

    // The "has loaded once" flag transitions on any settle (success or
    // failure), so the steady state after a failed first load is the full
    // interactive page with the error surfaced inline — never a stuck
    // full-page blank error with no way to retry/clear filters.
    expect(container.textContent).toContain("Boom");
    expect(container.querySelector("select")).not.toBeNull();
    expect(container.querySelector("table")).toBeNull();
  });
});

describe("AdminReviewsPageClient — refetch error keeps chrome mounted", () => {
  it("shows an inline banner inside the panel without unmounting header/filters", async () => {
    render(<AdminReviewsPageClient />);
    await flush();

    // Header should be mounted after a successful initial load.
    expect(container.textContent).toContain("Reseña");

    fetchMock().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Refetch boom" }),
    });

    const select = container.querySelector("select") as HTMLSelectElement;
    await act(async () => {
      select.value = "unapproved";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      await Promise.resolve();
    });
    await flush();

    // Header/filter chrome still mounted.
    expect(container.querySelector("select")).not.toBeNull();
    // Inline banner rendered with role=alert.
    const banner = container.querySelector('[role="alert"]');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain("Refetch boom");
  });
});
