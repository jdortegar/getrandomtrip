import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminBlogPageClient } from "@/app/[locale]/(secure)/dashboard/admin/AdminBlogPageClient";
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";
import type { AdminBlog } from "@/lib/admin/types";


(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const navigation = vi.hoisted(() => ({ locale: "es" }));

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: navigation.locale }),
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
  navigation.locale = "es";
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

describe("AdminBlogPageClient — post title cell", () => {
  it.each([
    { locale: "es", copy: esCopy },
    { locale: "en", copy: enCopy },
  ])(
    "shows only the title without subtitle or original-language metadata in $locale",
    async ({ locale, copy }) => {
      navigation.locale = locale;
      const post = blog({ subtitle: "A surprise destination awaits" });
      fetchMock().mockResolvedValue({
        ok: true,
        json: async () => ({ blogs: [post], pendingCount: 1, total: 1 }),
      });

      render(<AdminBlogPageClient />);
      await flush();

      const titleCell = container.querySelector("tbody tr td:nth-child(2)");
      expect(titleCell?.textContent).toBe(post.title);
      expect(container.textContent).not.toContain(post.subtitle);
      expect(container.textContent).not.toContain(
        copy.tripperBlogs.form.contentLanguage.canonicalLabel,
      );
    },
  );
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

describe("AdminBlogPageClient — single delete uses the in-app confirm dialog", () => {
  it("opens ConfirmModal instead of window.confirm and deletes only after confirming", async () => {
    const es = (await import("@/dictionaries/es.json")).default;
    const act_ = es.adminPages.blog.actions;
    const nativeConfirm = vi.fn(() => true);
    vi.stubGlobal("confirm", nativeConfirm);
    fetchMock().mockResolvedValue({
      ok: true,
      json: async () => ({ blogs: [blog({ status: "DRAFT" })], pendingCount: 0, total: 1 }),
    });

    render(<AdminBlogPageClient />);
    await flush();

    const deleteButton = Array.from(
      container.querySelectorAll('[data-component="TableIconButton"]'),
    )
      .find((wrapper) => wrapper.textContent === act_.delete)
      ?.querySelector("button") as HTMLButtonElement;
    act(() => deleteButton.click());
    await flush();

    expect(nativeConfirm).not.toHaveBeenCalled();
    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain(act_.deleteTitle);
    expect(
      fetchMock().mock.calls.some(([, init]) => (init as RequestInit)?.method === "DELETE"),
    ).toBe(false);

    const confirmButton = Array.from(dialog.querySelectorAll("button")).find(
      (b) => b.textContent === act_.delete,
    ) as HTMLButtonElement;
    await act(async () => confirmButton.click());
    await flush();

    expect(fetchMock()).toHaveBeenCalledWith("/api/admin/blogs/b1", { method: "DELETE" });
  });
});

describe("AdminBlogPageClient — bulk delete uses destructive styling", () => {
  it("keeps red hover styling and requires a selection and confirmation before deleting", async () => {
    const copy = esCopy.adminPages.blog.bulkActions;
    fetchMock().mockResolvedValue({
      ok: true,
      json: async () => ({
        blogs: [blog({ status: "DRAFT" })],
        pendingCount: 0,
        total: 1,
      }),
    });

    render(<AdminBlogPageClient />);
    await flush();

    const bulkDelete = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === copy.deleteSelected.replace("{count}", "0"),
    ) as HTMLButtonElement;
    expect(bulkDelete.disabled).toBe(true);
    expect(Array.from(bulkDelete.classList)).toEqual(expect.arrayContaining([
      "bg-red-600", "border-red-600", "text-white",
      "hover:bg-red-700", "hover:border-red-700", "focus-visible:ring-red-600/20",
      "h-11", "px-4", "rounded-sm", "text-[13px]", "tracking-[1px]",
      "disabled:bg-gray-100", "disabled:border-gray-200",
      "disabled:cursor-not-allowed", "disabled:text-gray-400",
    ]));
    expect(bulkDelete.classList.contains("hover:border-primary/90")).toBe(false);

    act(() => bulkDelete.click());
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();

    const checkbox = container.querySelector("tbody input[type=checkbox]") as HTMLInputElement;
    act(() => checkbox.click());
    expect(bulkDelete.disabled).toBe(false);
    expect(bulkDelete.textContent).toBe(copy.deleteSelected.replace("{count}", "1"));

    act(() => bulkDelete.click());
    await flush();
    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain(copy.confirmTitle.replace("{count}", "1"));
    expect(
      fetchMock().mock.calls.some(([, init]) => (init as RequestInit)?.method === "DELETE"),
    ).toBe(false);

    const confirmButton = Array.from(dialog.querySelectorAll("button")).find(
      (button) => button.textContent === copy.confirm,
    ) as HTMLButtonElement;
    await act(async () => confirmButton.click());
    await flush();

    expect(fetchMock()).toHaveBeenCalledWith("/api/admin/blogs/b1", { method: "DELETE" });
    expect(bulkDelete.disabled).toBe(true);
  });
});

describe("AdminBlogPageClient — RANDOMTRIP edit stays under the admin dashboard", () => {
  it("links the edit action to /dashboard/admin/blog/[id]/edit, not the tripper editor", async () => {
    fetchMock().mockResolvedValue({
      ok: true,
      json: async () => ({
        blogs: [blog({ status: "PUBLISHED", source: "RANDOMTRIP" } as Partial<AdminBlog>)],
        pendingCount: 0,
        total: 1,
      }),
    });

    render(<AdminBlogPageClient />);
    await flush();

    const hrefs = Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/es/dashboard/admin/blog/b1/edit");
    expect(hrefs.some((h) => h?.includes("/dashboard/tripper/blog/"))).toBe(false);
  });
});
