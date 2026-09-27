import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BlogPageClient } from "../blog/BlogPageClient";
import ExperiencesPageClient from "../experiences/ExperiencesPageClient";
import es from "@/dictionaries/es.json";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
vi.mock("next/navigation", () => ({ useParams: () => ({ locale: "es" }) }));
let container: HTMLDivElement;
let root: Root;
let requests: {
  url: string;
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
}[];
const cases = [
  {
    name: "blog",
    component: <BlogPageClient dict={es.tripperBlogs} locale="es" />,
    count: 2,
    status: "draft",
    typeKey: "travelType",
    copy: es.tripperBlogs,
  },
  {
    name: "experiences",
    component: (
      <ExperiencesPageClient dict={es.tripperExperiences} locale="es" />
    ),
    count: 3,
    status: "DRAFT",
    typeKey: "type",
    copy: es.tripperExperiences,
  },
];
beforeEach(() => {
  vi.useFakeTimers();
  Element.prototype.scrollIntoView = vi.fn();
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
function query(index: number) {
  return new URL(requests[index].url, "http://localhost").searchParams;
}
async function settle(index: number, total = 45) {
  await act(async () =>
    requests[index].resolve(
      Response.json({ blogs: [], experiences: [], total }),
    ),
  );
}
function input(value: string) {
  act(() => {
    const field = container.querySelector("input[type=search]")!;
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(field, value);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
function button(label: string) {
  return Array.from(container.querySelectorAll("button")).find(
    (el) => el.textContent?.trim() === label,
  )!;
}
function select(id: string, value: string) {
  act(() => {
    const field = container.querySelector<HTMLSelectElement>(`#${id}`)!;
    field.value = value;
    field.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
it.each(cases)(
  "$name keeps shared controls mounted, composes queries and clears stale/debounced work",
  async ({ component, name, count, status, typeKey }) => {
    act(() => root.render(component));
    await settle(0);
    const toolbar = container.querySelector(
      '[data-component="TableFilterToolbar"]',
    )!;
    const heading = container.querySelector("h1");
    const controls = Array.from(toolbar.querySelectorAll("input,select"));
    expect(toolbar.querySelectorAll("select")).toHaveLength(count);
    expect(toolbar.querySelector("input")?.placeholder).toBe(
      es.common.tableFilters.searchTitle,
    );
    act(() => button(es.common.pagination.next).click());
    expect(query(1).get("page")).toBe("2");
    await settle(1);
    select(
      `tripper-${name === "blog" ? "blog" : "experiences"}-status`,
      status,
    );
    await settle(2);
    select(
      `tripper-${name === "blog" ? "blog" : "experiences"}-type`,
      "couple",
    );
    await settle(3);
    input("Forest");
    const boundary = container.querySelector(
      '[data-component="TableQueryBoundary"]',
    )!;
    expect(boundary.getAttribute("aria-busy")).toBe("true");
    expect(boundary.querySelector("[inert]")).not.toBeNull();
    act(() => vi.advanceTimersByTime(349));
    expect(requests).toHaveLength(4);
    act(() => vi.advanceTimersByTime(1));
    expect(query(4).get("page")).toBe("1");
    expect(query(4).get("status")).toBe(status);
    expect(query(4).get(typeKey)).toBe("couple");
    expect(query(4).get("search")).toBe("Forest");
    act(() => button(es.common.tableFilters.clearFilters).click());
    expect(query(5).toString()).toBe("page=1&limit=20");
    // A stale finally must not release the new request's busy state.
    await act(async () => requests[4].reject(new Error("Stale search")));
    expect(boundary.getAttribute("aria-busy")).toBe("true");
    await settle(5, 7);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(boundary.getAttribute("aria-busy")).toBe("false");
    expect(toolbar.querySelector('[role="status"]')?.textContent).toContain(
      "7",
    );
    expect(container.querySelector("h1")).toBe(heading);
    expect(Array.from(toolbar.querySelectorAll("input,select"))).toEqual(
      controls,
    );
    input("Cancelled timer");
    act(() => button(es.common.tableFilters.clearFilters).click());
    const last = requests.length - 1;
    await settle(last, 3);
    act(() => vi.advanceTimersByTime(500));
    expect(requests).toHaveLength(last + 1);
  },
);
it.each(cases)(
  "$name distinguishes failures, retry and filtered empty results",
  async ({ component, copy }) => {
    act(() => root.render(component));
    await settle(0, 0);
    expect(container.textContent).toContain(
      "noPosts" in copy.emptyState
        ? copy.emptyState.noPosts
        : copy.emptyState.noExperiences,
    );
    input("Missing");
    act(() => vi.advanceTimersByTime(350));
    await act(async () =>
      requests[1].resolve(Response.json({}, { status: 503 })),
    );
    const retry = button(es.common.tableFilters.retry);
    expect(retry.closest("[inert]")).toBeNull();
    expect(
      container.querySelector('[data-component="TableQueryBoundary"] [hidden]'),
    ).not.toBeNull();
    act(() => retry.click());
    expect(retry.getAttribute("aria-busy")).toBe("true");
    expect(retry.textContent).toContain(es.common.tableFilters.loading);
    await settle(2, 0);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.textContent).toContain(copy.emptyState.noMatch);
    expect(
      Array.from(container.querySelectorAll("a")).some(
        (el) => el.textContent?.trim() === copy.emptyState.createFirst,
      ),
    ).toBe(false);
  },
);
it("keeps XSED experience filtering admin-only in tripper blog", async () => {
  act(() => root.render(<BlogPageClient dict={es.tripperBlogs} locale="es" />));
  await settle(0);
  expect(container.querySelector("#tripper-blog-experience")).toBeNull();
  act(() =>
    root.render(<BlogPageClient dict={es.tripperBlogs} isAdmin locale="es" />),
  );
  select("tripper-blog-experience", "xsed");
  expect(query(1).get("level")).toBe("xsed");
  await settle(1);
});

it.each(cases)(
  "$name preserves row deletion eligibility and clears selection when querying",
  async ({ component, name, copy }) => {
    act(() => root.render(component));
    const common = {
      title: "Editable",
      createdAt: "2026-09-01",
      updatedAt: "2026-09-01",
      isActive: true,
    };
    const blogs = [
      {
        ...common,
        id: "draft",
        status: "draft",
        format: "article",
        blocks: [],
        tags: [],
        travelType: [],
        excuseKey: [],
      },
      {
        ...common,
        id: "locked",
        title: "Locked",
        status: "pending_review",
        format: "article",
        blocks: [],
        tags: [],
        travelType: [],
        excuseKey: [],
      },
    ];
    const experiences = [
      {
        ...common,
        id: "draft",
        status: "DRAFT",
        type: ["couple"],
        level: "essenza",
        canDelete: true,
        minNights: 1,
        maxNights: 3,
        minPax: 1,
        maxPax: 2,
      },
      {
        ...common,
        id: "locked",
        title: "Locked",
        status: "PENDING_REVIEW",
        type: ["couple"],
        level: "essenza",
        canDelete: false,
        minNights: 1,
        maxNights: 3,
        minPax: 1,
        maxPax: 2,
      },
    ];
    await act(async () =>
      requests[0].resolve(Response.json({ blogs, experiences, total: 2 })),
    );
    const rows = Array.from(
      container.querySelectorAll<HTMLInputElement>(
        `input[aria-label="${copy.table.selectRow}"]`,
      ),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].disabled).toBe(false);
    expect(rows[1].disabled).toBe(true);
    act(() => rows[0].click());
    const bulk = button(
      copy.bulkActions.deleteSelected.replace("{count}", "1"),
    );
    expect(bulk.disabled).toBe(false);
    input("Changed");
    expect(rows[0].checked).toBe(false);
    expect(
      button(copy.bulkActions.deleteSelected.replace("{count}", "0")).disabled,
    ).toBe(true);
    expect(rows[0].closest("[inert]")).not.toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
    if (name === "experiences")
      expect(container.querySelector('a[href$="/locked"]')).not.toBeNull();
  },
);
