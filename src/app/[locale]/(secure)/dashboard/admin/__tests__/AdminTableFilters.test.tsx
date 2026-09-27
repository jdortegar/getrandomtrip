import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AdminBlogPageClient } from "../AdminBlogPageClient";
import { AdminExperiencesPageClient } from "../AdminExperiencesPageClient";
import { AdminReviewsPageClient } from "../AdminReviewsPageClient";
import { AdminUsersPageClient } from "../AdminUsersPageClient";
import es from "@/dictionaries/es.json";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "es" }),
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "me" } } }),
}));
const updateQuery = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/useQuerySync", () => ({ useQuerySync: () => updateQuery }));
let container: HTMLDivElement;
let root: Root;
let requests: {
  url: string;
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
}[];

beforeEach(() => {
  vi.useFakeTimers();
  updateQuery.mockClear();
  requests = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (url: string) =>
        new Promise<Response>((resolve, reject) =>
          requests.push({ url, resolve, reject }),
        ),
    ),
  );
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const cases = [
  {
    name: "blog",
    component: <AdminBlogPageClient />,
    count: 3,
    status: "pending",
    clearStatus: "PENDING_REVIEW,PENDING_TRIPPER_REVIEW",
  },
  {
    name: "experiences",
    component: <AdminExperiencesPageClient />,
    count: 3,
    status: "ACTIVE",
    clearStatus: "PENDING_REVIEW,PENDING_TRIPPER_REVIEW",
  },
  {
    name: "reviews",
    component: <AdminReviewsPageClient />,
    count: 1,
    status: "unapproved",
    clearStatus: null,
  },
  {
    name: "users",
    component: <AdminUsersPageClient copy={es.adminUsers} />,
    count: 0,
    status: null,
    clearStatus: null,
  },
];
function query(index: number) {
  return new URL(requests[index].url, "http://localhost").searchParams;
}
async function settle(index: number, total = 45) {
  await act(async () =>
    requests[index].resolve(
      Response.json({
        blogs: [],
        experiences: [],
        reviews: [],
        users: [],
        total,
        pendingCount: 2,
      }),
    ),
  );
}
function input(value: string) {
  const el = container.querySelector("input[type=search]")!;
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
function button(label: string) {
  return Array.from(container.querySelectorAll("button")).find(
    (el) => el.textContent?.trim() === label,
  )!;
}

it.each(cases)(
  "$name uses the shared toolbar and atomically clears while preserving domain defaults",
  async ({ component, count, status, clearStatus, name }) => {
    act(() => root.render(component));
    await settle(0);
    const toolbar = container.querySelector(
      '[data-component="TableFilterToolbar"]',
    )!;
    expect(toolbar).not.toBeNull();
    expect(toolbar.querySelectorAll("select")).toHaveLength(count);
    const controls = Array.from(toolbar.querySelectorAll("input,select"));
    for (const control of controls)
      expect(
        toolbar.querySelector(`label[for="${control.id}"]`),
      ).not.toBeNull();
    act(() => button(es.common.pagination.next).click());
    await settle(1);
    expect(query(1).get("page")).toBe("2");
    if (status) {
      act(() => {
        const select = toolbar.querySelector("select")!;
        select.value = status;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await settle(2);
    }
    input("Ana");
    const before = requests.length;
    expect(
      container
        .querySelector('[data-component="TableQueryBoundary"]')
        ?.getAttribute("aria-busy"),
    ).toBe("true");
    expect(
      container.querySelector('[data-component="TableQueryBoundary"] [inert]'),
    ).not.toBeNull();
    act(() => vi.advanceTimersByTime(349));
    expect(requests).toHaveLength(before);
    act(() => vi.advanceTimersByTime(1));
    expect(query(before).get("search")).toBe("Ana");
    expect(query(before).get("page")).toBe("1");
    act(() => button(es.common.tableFilters.clearFilters).click());
    const clear = requests.length - 1;
    expect(query(clear).has("search")).toBe(false);
    expect(query(clear).get("status")).toBe(clearStatus);
    expect(query(clear).get("page")).toBe("1");
    if (name === "experiences")
      expect(updateQuery).toHaveBeenLastCalledWith({
        status: undefined,
        type: undefined,
        level: undefined,
        search: undefined,
        page: undefined,
      });
    await settle(clear, 7);
    await act(async () => requests[before].reject(new Error("Stale search")));
    act(() => vi.advanceTimersByTime(500));
    expect(requests).toHaveLength(clear + 1);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(toolbar.querySelector('[role="status"]')?.textContent).toContain(
      "7",
    );
    expect(Array.from(toolbar.querySelectorAll("input,select"))).toEqual(
      controls,
    );
    expect(
      container
        .querySelector('[data-component="TableQueryBoundary"]')
        ?.getAttribute("aria-busy"),
    ).toBe("false");
  },
);

it.each(cases)(
  "$name reports a failed query and retries without unmounting controls",
  async ({ component }) => {
    act(() => root.render(component));
    await settle(0);
    const toolbar = container.querySelector(
      '[data-component="TableFilterToolbar"]',
    );
    input("Fail");
    act(() => vi.advanceTimersByTime(350));
    await act(async () =>
      requests[1].resolve(Response.json({}, { status: 503 })),
    );
    const retry = button(es.common.tableFilters.retry);
    expect(retry).toBeDefined();
    expect(retry.closest("[inert]")).toBeNull();
    act(() => retry.click());
    expect(retry.getAttribute("aria-busy")).toBe("true");
    expect(retry.textContent).toContain(es.common.tableFilters.loading);
    expect(query(2).get("search")).toBe("Fail");
    await settle(2, 0);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(
      container.querySelector('[data-component="TableFilterToolbar"]'),
    ).toBe(toolbar);
  },
);
