import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminTripRequestsPageClient } from "@/app/[locale]/(secure)/dashboard/admin/AdminTripRequestsPageClient";
import esCopy from "@/dictionaries/es.json";
import type { AdminTripRequest } from "@/lib/admin/types";
import type { MarketingDictionary } from "@/lib/types/dictionary";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "es" }),
  useSearchParams: () => new URLSearchParams(),
}));

const dict = esCopy.adminTripEditModal as unknown as MarketingDictionary["adminTripEditModal"];

let container: HTMLDivElement;
let root: Root;

function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<AdminTripRequestsPageClient dict={dict} />);
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

function trip(overrides: Partial<AdminTripRequest> = {}): AdminTripRequest {
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
  } as AdminTripRequest;
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        statusCounts: {},
        total: 1,
        tripRequests: [trip()],
      }),
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

describe("AdminTripRequestsPageClient — refetch error keeps chrome mounted", () => {
  it("threads error/isLoading into TripRequestsTable without unmounting filters", async () => {
    render();
    await flush();

    expect(container.querySelector("select")).not.toBeNull();

    fetchMock().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Refetch boom" }),
    });

    const select = container.querySelector("select") as HTMLSelectElement;
    await act(async () => {
      select.value = "DRAFT";
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
