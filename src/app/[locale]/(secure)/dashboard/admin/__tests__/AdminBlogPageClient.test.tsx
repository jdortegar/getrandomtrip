import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminBlogPageClient } from "@/app/[locale]/(secure)/dashboard/admin/AdminBlogPageClient";
import type { AdminBlog } from "@/lib/admin/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    status: "PENDING_REVIEW",
    subtitle: "",
    title: "A trip",
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
      select.value = "all";
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
      select.value = "all";
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
