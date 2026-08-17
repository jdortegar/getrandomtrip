import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TripRequestsTable } from "../TripRequestsTable";
import { formatAdminDate } from "@/lib/admin/format";
import type { AdminTripRequest } from "@/lib/admin/types";
import type { MarketingDictionary } from "@/lib/types/dictionary";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy: MarketingDictionary["adminPages"]["tripRequests"] = {
  eyebrow: "Client requests",
  title: "Trip Requests",
  edit: "Edit",
  errorLoad: "Failed to load trip requests.",
  empty: "No trip requests found.",
  filters: {
    allStatuses: "All statuses",
    allTypes: "All types",
    allLevels: "All levels",
    allPayments: "All payments",
    noPayment: "No payment",
    clearFilters: "Clear filters",
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
  overrides: { error?: string | null; isLoading?: boolean } = {},
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
        locale="en"
        onSort={onSort}
        paymentStatusLabels={{}}
        sortBy="tripDate"
        sortOrder="asc"
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

describe("TripRequestsTable — trip date column", () => {
  it("renders a Trip date header", () => {
    render([baseTrip()]);
    const headers = Array.from(container.querySelectorAll("th")).map(
      (th) => th.textContent,
    );
    expect(headers).toContain("Trip date");
  });

  it("renders the formatted startDate for a row", () => {
    const startDate = "2026-08-22T00:00:00.000Z";
    render([baseTrip({ startDate })]);
    const text = container.textContent ?? "";
    expect(text).toContain(formatAdminDate(startDate));
  });

  it("renders a placeholder when startDate is null", () => {
    render([baseTrip({ startDate: null })]);
    const text = container.textContent ?? "";
    expect(text).toContain("—");
  });
});

describe("TripRequestsTable — column sorters", () => {
  it("renders a sort button for every real column except Actions", () => {
    render([baseTrip()]);
    const headers = Array.from(container.querySelectorAll("th"));
    const sortableHeaders = headers.filter((th) => th.querySelector("button"));
    expect(sortableHeaders).toHaveLength(6);
    const actionsHeader = headers.find((th) => th.textContent === "Actions");
    expect(actionsHeader?.querySelector("button")).toBeNull();
  });

  it("marks the active sort column's header with aria-sort", () => {
    render([baseTrip()]);
    const headers = Array.from(container.querySelectorAll("th"));
    const tripDateHeader = headers.find((th) =>
      th.textContent?.includes("Trip date"),
    );
    expect(tripDateHeader?.getAttribute("aria-sort")).toBe("ascending");
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
