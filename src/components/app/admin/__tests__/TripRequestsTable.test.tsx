import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TripRequestsTable } from "../TripRequestsTable";
import { formatAdminDate } from "@/lib/admin/format";
import type { AdminTripRequest } from "@/lib/admin/types";
import type { MarketingDictionary } from "@/lib/types/dictionary";


(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy: MarketingDictionary["adminPages"]["tripRequests"] = {
  eyebrow: "Client requests",
  title: "Trip Requests",
  edit: "Edit",
  errorLoad: "Failed to load trip requests.",
  empty: "No trip requests found.",
  filters: {
    all: "All",
    typeLabel: "Trip type",
    levelLabel: "Level",
    searchLabel: "Search travelers",
    allStatuses: "All statuses",
    allTypes: "All types",
    allLevels: "All levels",
    allPayments: "All payments",
    noPayment: "No payment",
    clearFilters: "Clear filters",
    loading: "Loading requests…",
    of: "of",
    count: "requests",
    searchPlaceholder: "Search by traveler name or email…",
    types: {
      solo: "Solo",
      couple: "Couple",
      family: "Family",
      group: "Group",
      honeymoon: "Honeymoon",
      paws: "With pets",
      xsed: "TGIS Drop",
    },
    levels: {
      essenza: "Essenza",
      "modo-explora": "Modo Explora",
      "explora-plus": "Explora+",
      bivouac: "Bivouac",
      "atelier-getaway": "Atelier Getaway",
      xsed: "TGIS Drop",
    },
  },
  columns: {
    traveler: "Traveler",
    origin: "Origin",
    purchaseDate: "Purchase date",
    tripDate: "Trip date",
    typeLevel: "Type / Level",
    status: "Status",
    payment: "Payment",
    actions: "Actions",
  },
  sort: { ariaSortBy: "Sort by {field}" },
};

function baseTrip(overrides: Partial<AdminTripRequest> = {}): AdminTripRequest {
  return {
    accommodationType: "any",
    actualDestination: null,
    addons: [],
    arrivePref: "any",
    avoidDestinations: [],
    climate: "any",
    completedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    customerFeedback: null,
    customerRating: null,
    departPref: "any",
    destinationRevealedAt: null,
    endDate: null,
    experience: null,
    experienceId: null,
    from: "admin",
    id: "trip-1",
    level: "essenza",
    maxTravelTime: "no-limit",
    nights: 2,
    originCity: "Buenos Aires",
    originCountry: "Argentina",
    pax: 2,
    paxDetails: null,
    payment: null,
    startDate: "2026-08-22T00:00:00.000Z",
    status: "CONFIRMED",
    transport: "plane",
    tripperId: null,
    tripPhotos: null,
    type: "couple",
    updatedAt: "2026-01-01T00:00:00.000Z",
    user: { email: "ana@example.com", id: "user-1", locale: null, name: "Ana" },
    ...overrides,
  };
}

let container: HTMLDivElement;
let root: Root;

function render(
  trips: AdminTripRequest[],
  onSort = vi.fn(),
  overrides: { error?: string | null; isLoading?: boolean; locale?: string } = {},
) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <TripRequestsTable
        copy={copy}
        error={overrides.error ?? null}
        isLoading={overrides.isLoading ?? false}
        locale={overrides.locale ?? "en"}
        onSort={onSort}
        paymentStatusLabels={{}}
        sortBy="purchaseDate"
        sortOrder="desc"
        trips={trips}
        tripStatusLabels={{}}
      />,
    );
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
});

describe("TripRequestsTable — product capitalization", () => {
  it.each(["en", "es"])("renders XSED as plain uppercase text in %s", (locale) => {
    const trip = baseTrip({ type: "xsed", level: "Xsed" });
    render([trip], vi.fn(), { locale });
    const cell = container.querySelectorAll("tbody td")[4];
    expect(Array.from(cell.querySelectorAll("p"), (p) => p.textContent)).toEqual([
      "XSED",
      "XSED",
    ]);
    expect(cell.querySelector("span")).toBeNull();
    expect(cell.querySelector(".bg-xsed")).toBeNull();
    expect(trip).toMatchObject({ type: "xsed", level: "Xsed" });
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      `/${locale}/dashboard/admin/trip-requests/trip-1`,
    );
  });

  it("preserves ordinary type and level labels", () => {
    render([baseTrip()]);
    const cell = container.querySelectorAll("tbody td")[4];
    expect(Array.from(cell.querySelectorAll("p"), (p) => p.textContent)).toEqual([
      "couple",
      "essenza",
    ]);
  });
});

describe("TripRequestsTable — purchase date column", () => {
  it.each([0, 23])("keeps purchases at local hour %i on their local date", (hour) => {
    const paidAt = new Date(2026, 9, 2, hour, 30).toISOString();
    render([baseTrip({ payment: { amount: 500, currency: "USD", paidAt, status: "APPROVED" } })]);
    expect(container.querySelectorAll("tbody td")[1].textContent).toBe("Oct 2, 2026");
  });

  it("shows recorded paidAt before trip date, not request creation or departure", () => {
    const paidAt = "2026-09-27T12:00:00.000Z";
    render([baseTrip({ payment: { amount: 500, currency: "USD", paidAt, status: "APPROVED" } })]);
    const headers = Array.from(container.querySelectorAll("th"), (th) => th.textContent);
    expect(headers.slice(0, 3)).toEqual(["Traveler", "Purchase date", "Trip date"]);
    expect(container.querySelectorAll("tbody td")[1].textContent).toBe(formatAdminDate(paidAt));
  });

  it.each([
    null,
    { amount: 500, currency: "USD", paidAt: null, status: "PENDING" },
    { amount: 500, currency: "USD", paidAt: null, status: "APPROVED" },
  ])(
    "uses a dash when no purchase date is recorded",
    (payment) => {
      render([baseTrip({ payment })]);
      expect(container.querySelectorAll("tbody td")[1].textContent).toBe("—");
    },
  );

  it("sorts by purchase date when its header is clicked", () => {
    const onSort = vi.fn();
    render([baseTrip()], onSort);
    const button = container.querySelector('button[aria-label="Sort by Purchase date"]');
    act(() => { button?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    expect(onSort).toHaveBeenCalledWith("purchaseDate");
  });
});

describe("TripRequestsTable — trip date column", () => {
  it("renders a Trip date header", () => {
    render([baseTrip()]);
    const headers = Array.from(container.querySelectorAll("th")).map(
      (th) => th.textContent,
    );
    expect(headers).toContain("Trip date");
  });

  it.each([
    ["en", "Oct 3, 2026"],
    ["es", "3 oct 2026"],
  ])("preserves the booked calendar date in %s", (locale, expected) => {
    render(
      [baseTrip({ startDate: "2026-10-03T00:00:00.000Z" })],
      vi.fn(),
      { locale },
    );
    expect(container.querySelectorAll("tbody td")[2].textContent).toBe(expected);
  });

  it("renders a placeholder when startDate is null", () => {
    render([baseTrip({ startDate: null })]);
    expect(container.querySelectorAll("tbody td")[2].textContent).toBe("—");
  });
});

describe("TripRequestsTable — column sorters", () => {
  it("renders a sort button for every real column except Actions", () => {
    render([baseTrip()]);
    const headers = Array.from(container.querySelectorAll("th"));
    const sortableHeaders = headers.filter((th) => th.querySelector("button"));
    expect(sortableHeaders).toHaveLength(7);
    const actionsHeader = headers.find((th) => th.textContent === "Actions");
    expect(actionsHeader?.querySelector("button")).toBeNull();
  });

  it("marks the active sort column's header with aria-sort", () => {
    render([baseTrip()]);
    const headers = Array.from(container.querySelectorAll("th"));
    const purchaseDateHeader = headers.find((th) =>
      th.textContent?.includes("Purchase date"),
    );
    expect(purchaseDateHeader?.getAttribute("aria-sort")).toBe("descending");
  });

  it("calls onSort with the clicked field", () => {
    const onSort = vi.fn();
    render([baseTrip()], onSort);
    const statusButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent?.includes("Status"),
    );
    act(() => {
      statusButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onSort).toHaveBeenCalledWith("status");
  });
});

describe("TripRequestsTable — loading overlay and inline error", () => {
  it("sets aria-busy=true on the panel when isLoading is true", () => {
    render([baseTrip()], vi.fn(), { isLoading: true });
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.getAttribute("aria-busy")).toBe("true");
    expect(panel.className).toContain("pointer-events-none");
  });

  it("sets aria-busy=false and no dimming classes when not loading", () => {
    render([baseTrip()], vi.fn(), { isLoading: false });
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.getAttribute("aria-busy")).toBe("false");
    expect(panel.className).not.toContain("pointer-events-none");
  });

  it("renders an inline role=alert banner when error is set, keeping the table mounted", () => {
    render([baseTrip()], vi.fn(), { error: "Something broke" });
    const banner = container.querySelector('[role="alert"]');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain("Something broke");
    expect(container.querySelector("table")).not.toBeNull();
  });

  it("renders no banner when error is null", () => {
    render([baseTrip()]);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});
