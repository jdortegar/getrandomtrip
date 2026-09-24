import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminBlogPageClient } from "@/app/[locale]/(secure)/dashboard/admin/AdminBlogPageClient";
import type { AdminBlog } from "@/lib/admin/types";


(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "es" }),
  useRouter: () => ({ push: vi.fn() }),
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

function blog(overrides: Partial<AdminBlog> = {}): AdminBlog {
  return {
    author: { email: "a@b.com", name: "Ana" },
    id: "b1",
    level: null,
    status: "PENDING_REVIEW",
    subtitle: "",
    title: "A trip",
    travelType: [],
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as AdminBlog;
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ blogs: [blog()], pendingCount: 1, total: 25 }),
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

describe("AdminBlogPageClient — refetch keeps chrome mounted and dims the panel", () => {
  it("keeps the tab select mounted and sets aria-busy during a tab-change refetch", async () => {
    render(<AdminBlogPageClient />);
    await flush();

    const panel = container.querySelector(".overflow-hidden.rounded-xl") as HTMLElement;
    expect(panel.getAttribute("aria-busy")).toBe("false");

    let resolveFetch: (value: unknown) => void = () => {};
    fetchMock().mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const select = container.querySelector("select") as HTMLSelectElement;
    act(() => {
      select.value = "pending";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(container.querySelector("select")).not.toBeNull();
    expect(panel.getAttribute("aria-busy")).toBe("true");

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({ blogs: [blog()], pendingCount: 1, total: 25 }),
      });
      await Promise.resolve();
    });
    await flush();

    const settledPanel = container.querySelector(".overflow-hidden.rounded-xl") as HTMLElement;
    expect(settledPanel.getAttribute("aria-busy")).toBe("false");
  });
});

describe("AdminBlogPageClient — Level and Travel type columns", () => {
  it("renders the level label and travel-type labels, falling back to — when unset", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          blogs: [
            blog({ id: "b1", level: "xsed", travelType: ["solo", "couple"] }),
            blog({ id: "b2", level: null, travelType: [] }),
          ],
          pendingCount: 0,
          total: 2,
        }),
      }),
    );

    render(<AdminBlogPageClient />);
    await flush();

    const cellsText = container.textContent ?? "";
    expect(cellsText).toContain("XSED");
    expect(cellsText).toContain("—");
  });

  it("lists every EXPERIENCE_LEVELS value in the level filter dropdown", async () => {
    render(<AdminBlogPageClient />);
    await flush();

    const selects = Array.from(container.querySelectorAll("select"));
    const levelSelect = selects[1] as HTMLSelectElement; // tab, level, travelType
    const values = Array.from(levelSelect.options).map((o) => o.value);
    expect(values).toEqual([
      "all",
      "essenza",
      "modo-explora",
      "explora-plus",
      "bivouac",
      "atelier-getaway",
      "xsed",
    ]);
  });
});

describe("AdminBlogPageClient — refetch error keeps chrome mounted", () => {
  it("shows an inline banner without unmounting the tab select", async () => {
    render(<AdminBlogPageClient />);
    await flush();

    fetchMock().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Refetch boom" }),
    });

    const select = container.querySelector("select") as HTMLSelectElement;
    await act(async () => {
      select.value = "pending";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      await Promise.resolve();
    });
    await flush();

    expect(container.querySelector("select")).not.toBeNull();
    const banner = container.querySelector('[role="alert"]');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain("Refetch boom");
  });
});
