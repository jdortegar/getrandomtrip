import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TravelerTripsPageClient } from "../TravelerTripsPageClient";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

const route = vi.hoisted(() => ({ locale: "en" }));
vi.mock("next/navigation", () => ({ useParams: () => route }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

interface PendingRequest {
  url: string;
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
}

let requests: PendingRequest[];
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  requests = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (url: string) =>
        new Promise<Response>((resolve, reject) => {
          requests.push({ url, resolve, reject });
        }),
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

function render(locale: "en" | "es" = "en") {
  route.locale = locale;
  const copy = locale === "en" ? en : es;
  act(() =>
    root.render(
      <TravelerTripsPageClient
        copy={copy.dashboard}
        locale={locale}
        pageCopy={copy.travelerDashboard.trips}
      />,
    ),
  );
}

async function settle(
  index: number,
  id: string | null = "first-trip",
  total = 41,
) {
  await act(async () =>
    requests[index].resolve(
      new Response(
        JSON.stringify({
          trips: id
            ? [
                {
                  id,
                  type: "couple",
                  level: "essenza",
                  status: "CONFIRMED",
                  startDate: "2027-01-01",
                  endDate: "2027-01-03",
                  originCity: "Origin",
                  originCountry: "Country",
                  pax: 2,
                  totalTripUsd: 700,
                },
              ]
            : [],
          total,
        }),
        { status: 200 },
      ),
    ),
  );
}

function selectFilter(value: string, index = 0) {
  const select = container.querySelectorAll("select")[index];
  expect(select).not.toBeNull();
  act(() => {
    select!.value = value;
    select!.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function button(label: string) {
  const element = Array.from(container.querySelectorAll("button")).find(
    (item) => item.textContent?.trim() === label,
  );
  expect(element).toBeDefined();
  return element!;
}

function panel() {
  return container.querySelector('[data-component="TableLoadingOverlay"]')!;
}

function query(index: number) {
  return Object.fromEntries(
    new URL(requests[index].url, "http://localhost").searchParams,
  );
}

it("preserves heading, dropdown and pager across deferred page/filter refreshes", async () => {
  render();
  expect(
    container.querySelector('[data-component="DashboardSkeleton"]'),
  ).not.toBeNull();
  await settle(0);
  expect(query(0)).toEqual({ page: "1", limit: "20" });
  const heading = container.querySelector("h2");
  const select = container.querySelector("select");
  const pagination = container.querySelector('[data-component="Pagination"]');
  const firstPanel = panel();

  act(() => button(en.common.pagination.next).click());
  expect(query(1)).toEqual({ page: "2", limit: "20" });
  expect(container.querySelector("h2")).toBe(heading);
  expect(container.querySelector("select")).toBe(select);
  expect(container.querySelector('[data-component="Pagination"]')).toBe(
    pagination,
  );
  expect(panel()).toBe(firstPanel);
  expect(panel().getAttribute("aria-busy")).toBe("true");
  expect(
    container
      .querySelector('a[href="/en/dashboard/trips/first-trip"]')
      ?.closest("[inert]"),
  ).not.toBeNull();
  expect(pagination?.closest("[inert]")).not.toBeNull();
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    "Loading trips…",
  );
  expect(select?.disabled).toBe(false);
  await settle(1, "page-two");

  selectFilter("upcoming");
  expect(query(2)).toEqual({
    page: "1",
    limit: "20",
    status: "CONFIRMED,REVEALED",
  });
  expect(container.querySelector("h2")).toBe(heading);
  expect(container.querySelector("select")).toBe(select);
  expect(panel().getAttribute("aria-busy")).toBe("true");
  await settle(2, "upcoming-trip");
  expect(panel().getAttribute("aria-busy")).toBe("false");
  expect(container.querySelector("tbody")?.closest("[inert]")).toBeNull();

  act(() => button(en.common.pagination.next).click());
  await settle(3, "upcoming-page-two");
  selectFilter("upcoming");
  expect(requests).toHaveLength(4);
  selectFilter("completed");
  expect(query(4)).toEqual({ page: "1", limit: "20", status: "COMPLETED" });
  await settle(4, "completed-trip");
});

function search(value: string) {
  const input = container.querySelector<HTMLInputElement>(
    'input[type="search"]',
  );
  expect(input).not.toBeNull();
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, value);
    input!.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

it("combines experience/type/status/search before pagination and resets only changed filters", async () => {
  vi.useFakeTimers();
  render();
  await settle(0);
  const heading = container.querySelector("h2");
  const controls = Array.from(container.querySelectorAll("select,input"));
  selectFilter("upcoming");
  await settle(1);
  act(() => button(en.common.pagination.next).click());
  await settle(2);
  selectFilter("xsed", 1);
  expect(query(3)).toEqual({
    page: "1",
    limit: "20",
    status: "CONFIRMED,REVEALED",
    level: "xsed",
  });
  await settle(3);
  selectFilter("xsed", 2);
  expect(query(4)).toEqual({ ...query(3), type: "xsed" });
  await settle(4);
  act(() => button(en.common.pagination.next).click());
  await settle(5);
  selectFilter("xsed", 1);
  selectFilter("xsed", 2);
  expect(requests).toHaveLength(6);
  search("  Buenos Aires  ");
  expect(panel().getAttribute("aria-busy")).toBe("true");
  expect(container.querySelector("tbody")?.closest("[inert]")).not.toBeNull();
  expect(requests).toHaveLength(6);
  act(() => vi.advanceTimersByTime(349));
  expect(requests).toHaveLength(6);
  act(() => vi.advanceTimersByTime(1));
  expect(query(6)).toEqual({ ...query(4), search: "Buenos Aires" });
  expect(container.querySelector("h2")).toBe(heading);
  expect(Array.from(container.querySelectorAll("select,input"))).toEqual(
    controls,
  );
  await settle(6);
  act(() => button(en.common.pagination.next).click());
  expect(query(7)).toEqual({ ...query(6), page: "2" });
  await settle(7);
});

it("debounces typing, ignores old results during search and preserves latest-query retry", async () => {
  vi.useFakeTimers();
  render();
  await settle(0);
  selectFilter("couple", 2);
  search("Rio");
  act(() => vi.advanceTimersByTime(200));
  search("Pilar");
  await settle(1, "stale-type-result");
  expect(container.querySelector('a[href*="stale-type-result"]')).toBeNull();
  expect(panel().getAttribute("aria-busy")).toBe("true");
  act(() => vi.advanceTimersByTime(349));
  expect(requests).toHaveLength(2);
  act(() => vi.advanceTimersByTime(1));
  expect(query(2)).toEqual({
    page: "1",
    limit: "20",
    type: "couple",
    search: "Pilar",
  });
  search("Cuenca");
  act(() => vi.advanceTimersByTime(350));
  await settle(2, "stale-search-result");
  expect(container.querySelector('a[href*="stale-search-result"]')).toBeNull();
  await act(async () => requests[3].reject(new Error("Offline")));
  act(() => button(en.travelerDashboard.trips.retry).click());
  expect(query(4)).toEqual(query(3));
  await settle(4, "retried-search", 1);
  expect(container.querySelector('a[href*="retried-search"]')).not.toBeNull();
});

it("treats whitespace as no search without reset/fetch and clears a real search", async () => {
  vi.useFakeTimers();
  render();
  await settle(0);
  act(() => button(en.common.pagination.next).click());
  await settle(1);
  search("   ");
  act(() => vi.advanceTimersByTime(400));
  expect(requests).toHaveLength(2);
  expect(panel().getAttribute("aria-busy")).toBe("false");
  search("Pilar");
  act(() => vi.advanceTimersByTime(350));
  await settle(2);
  search("  ");
  act(() => vi.advanceTimersByTime(350));
  expect(query(3)).toEqual({ page: "1", limit: "20" });
  await settle(3);
});

it.each(["experience", "type", "search"])(
  "does not claim an empty account for empty %s results",
  async (kind) => {
    vi.useFakeTimers();
    render();
    await settle(0);
    if (kind === "search") {
      search("No such origin");
      act(() => vi.advanceTimersByTime(350));
    } else
      selectFilter(
        kind === "experience" ? "xsed" : "solo",
        kind === "experience" ? 1 : 2,
      );
    await settle(1, null, 0);
    expect(container.textContent).toContain(
      en.travelerDashboard.trips.emptyFiltered,
    );
    expect(container.textContent).not.toContain(
      en.dashboard.upcomingTrips.emptyTitle,
    );
  },
);

it.each(["success", "failure"])(
  "ignores a stale %s after a newer filter has loaded",
  async (outcome) => {
    render();
    await settle(0);
    selectFilter("upcoming");
    selectFilter("completed");
    await settle(2, "latest-trip");
    if (outcome === "success") await settle(1, "stale-trip");
    else await act(async () => requests[1].reject(new Error("Stale request")));
    expect(
      container.querySelector('a[href="/en/dashboard/trips/latest-trip"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('a[href="/en/dashboard/trips/stale-trip"]'),
    ).toBeNull();
    expect(container.querySelector("select")?.value).toBe("completed");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(panel().getAttribute("aria-busy")).toBe("false");
  },
);

it("does not clear busy state when an older request settles first", async () => {
  render();
  await settle(0);
  selectFilter("upcoming");
  selectFilter("completed");
  await settle(1, "stale-trip");
  expect(panel().getAttribute("aria-busy")).toBe("true");
  expect(
    container.querySelector('a[href="/en/dashboard/trips/stale-trip"]'),
  ).toBeNull();
  await settle(2, "latest-trip");
});

it.each(["en", "es"] as const)(
  "shows a localized refresh error and retries without stale rows in %s",
  async (locale) => {
    const copy = (locale === "en" ? en : es).travelerDashboard.trips;
    render(locale);
    await settle(0);
    const heading = container.querySelector("h2");
    const select = container.querySelector("select");
    selectFilter("completed");
    await act(async () =>
      requests[1].resolve(new Response("{}", { status: 503 })),
    );
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      copy.errorLoad,
    );
    expect(container.querySelector("tbody")).toBeNull();
    expect(container.textContent).not.toContain(copy.emptyFiltered);
    expect(container.querySelector("h2")).toBe(heading);
    expect(container.querySelector("select")).toBe(select);
    const retry = button(copy.retry);
    expect(retry.closest("[inert]")).toBeNull();
    act(() => retry.click());
    expect(query(2)).toEqual(query(1));
    expect(panel().getAttribute("aria-busy")).toBe("true");
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      copy.loading,
    );
    await settle(2, "retried-trip", 1);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(panel().getAttribute("aria-busy")).toBe("false");
  },
);

it("shows an initial network error rather than a false empty account and permits retry", async () => {
  render();
  await act(async () => requests[0].reject(new Error("Network error")));
  expect(container.querySelector('[role="alert"]')).not.toBeNull();
  expect(container.textContent).not.toContain(
    en.dashboard.upcomingTrips.emptyTitle,
  );
  const select = container.querySelector("select");
  act(() => button(en.travelerDashboard.trips.retry).click());
  expect(container.querySelector("select")).toBe(select);
  expect(panel().getAttribute("aria-busy")).toBe("true");
  await settle(1, "retry-trip", 1);
});

it("keeps the dropdown through empty all/filtered states without claiming emptiness while loading", async () => {
  render();
  await settle(0, null, 0);
  expect(container.textContent).toContain(
    en.dashboard.upcomingTrips.emptyTitle,
  );
  const select = container.querySelector("select");
  selectFilter("upcoming");
  expect(container.textContent).not.toContain(
    en.dashboard.upcomingTrips.emptyTitle,
  );
  await settle(1, null, 0);
  expect(container.textContent).toContain(
    en.travelerDashboard.trips.emptyFiltered,
  );
  expect(container.querySelector("select")).toBe(select);
  selectFilter("all");
  expect(container.textContent).not.toContain(
    en.dashboard.upcomingTrips.emptyTitle,
  );
  await settle(2, null, 0);
  expect(container.textContent).toContain(
    en.dashboard.upcomingTrips.emptyTitle,
  );
  expect(container.querySelector("select")).toBe(select);
});

it.each(["debounce", "refetch", "error"])(
  "clears all filters and cancels stale work during %s",
  async (state) => {
    vi.useFakeTimers();
    render();
    await settle(0);
    const heading = container.querySelector("h2");
    const controls = Array.from(container.querySelectorAll("input,select"));
    expect(
      container.querySelector('[data-component="TableFilterToolbar"]'),
    ).not.toBeNull();
    selectFilter("upcoming");
    await settle(1);
    selectFilter("xsed", 1);
    await settle(2);
    selectFilter("xsed", 2);
    await settle(3);
    act(() => button(en.common.pagination.next).click());
    await settle(4);
    search("Pilar");
    if (state !== "debounce") act(() => vi.advanceTimersByTime(350));
    if (state === "error")
      await act(async () => requests[5].reject(new Error("Offline")));
    const previousCount = requests.length;
    act(() => button("Clear filters").click());
    expect(requests).toHaveLength(previousCount + 1);
    expect(query(previousCount)).toEqual({ page: "1", limit: "20" });
    expect(
      Array.from(container.querySelectorAll("select")).map(
        (item) => item.value,
      ),
    ).toEqual(["all", "all", "all"]);
    expect(container.querySelector("input")?.value).toBe("");
    expect(container.querySelector("h2")).toBe(heading);
    expect(Array.from(container.querySelectorAll("input,select"))).toEqual(
      controls,
    );
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(panel().getAttribute("aria-busy")).toBe("true");
    expect(container.querySelector("tbody")?.closest("[inert]")).not.toBeNull();
    act(() => vi.advanceTimersByTime(500));
    expect(requests).toHaveLength(previousCount + 1);
    await settle(previousCount, "cleared-trip");
    if (state === "refetch") await settle(5, "stale-search-trip");
    expect(container.querySelector('a[href*="stale-search-trip"]')).toBeNull();
    expect(container.querySelector('a[href*="cleared-trip"]')).not.toBeNull();
    expect(panel().getAttribute("aria-busy")).toBe("false");
  },
);

it("clears search-only pending input without leaving the table busy or replaying its debounce", async () => {
  vi.useFakeTimers();
  render();
  await settle(0);
  search("Pilar");
  expect(requests).toHaveLength(1);
  act(() => button("Clear filters").click());
  expect(query(1)).toEqual({ page: "1", limit: "20" });
  act(() => vi.advanceTimersByTime(500));
  expect(requests).toHaveLength(2);
  await settle(1, "all-trips");
  expect(panel().getAttribute("aria-busy")).toBe("false");
  expect(
    container.querySelector('[data-component="TableFilterToolbar"] button'),
  ).toBeNull();
});
