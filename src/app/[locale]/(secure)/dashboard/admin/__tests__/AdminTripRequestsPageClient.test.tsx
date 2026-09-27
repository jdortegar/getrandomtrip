import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminTripRequestsPageClient } from "@/app/[locale]/(secure)/dashboard/admin/AdminTripRequestsPageClient";
import esCopy from "@/dictionaries/es.json";
import enCopy from "@/dictionaries/en.json";
import type { AdminTripRequest } from "@/lib/admin/types";
import type { MarketingDictionary } from "@/lib/types/dictionary";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let locale = "es";
let initialSearch = "";

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale }),
  useSearchParams: () => new URLSearchParams(initialSearch),
}));

const dict =
  esCopy.adminTripEditModal as unknown as MarketingDictionary["adminTripEditModal"];

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
  locale = "es";
  initialSearch = "";
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
  vi.useRealTimers();
});

function lastQuery() {
  return new URL(fetchMock().mock.calls.at(-1)![0], "http://localhost")
    .searchParams;
}

async function changeFilter(id: string, value: string) {
  const select = container.querySelector<HTMLSelectElement>(`#${id}`)!;
  await act(async () => {
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("AdminTripRequestsPageClient — accessible mobile filters", () => {
  it.each([
    [
      "en",
      enCopy,
      ["Search travelers", "Status", "Trip type", "Level", "Payment"],
    ],
    [
      "es",
      esCopy,
      ["Buscar viajeros", "Estado", "Tipo de viaje", "Nivel", "Pago"],
    ],
  ] as const)(
    "labels every control in %s and separates search from results",
    async (language, copy, labels) => {
      locale = language;
      render();
      await flush();

      const panel = container.querySelector(
        '[data-component="TripRequestsFilters"]',
      )!;
      const controls = Array.from(panel.querySelectorAll("input, select"));
      expect(controls).toHaveLength(5);
      expect(
        controls.map(
          (control) =>
            panel.querySelector(`label[for="${control.id}"]`)?.textContent,
        ),
      ).toEqual(labels);
      expect(panel.querySelector("input")?.className).toContain("w-full");
      expect(panel.querySelector('[role="status"]')?.textContent).toBe(
        `1 ${copy.adminPages.tripRequests.filters.of} 1 ${copy.adminPages.tripRequests.filters.count}`,
      );
      expect(
        panel
          .querySelector('[role="status"]')
          ?.parentElement?.querySelector("input"),
      ).toBeNull();
      expect(panel.querySelector("button")).toBeNull();
    },
  );

  it.each([
    ["trip-request-status", "status", "CONFIRMED"],
    ["trip-request-type", "type", "couple"],
    ["trip-request-level", "level", "essenza"],
    ["trip-request-payment", "paymentStatus", "NO_PAYMENT"],
  ])(
    "preserves the %s query and resets pagination",
    async (id, parameter, value) => {
      fetchMock().mockResolvedValue({
        ok: true,
        json: async () => ({ total: 53, tripRequests: [trip()] }),
      });
      render();
      await flush();
      await act(async () => {
        container
          .querySelector('[data-component="Pagination"] button:last-child')
          ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
      expect(lastQuery().get("page")).toBe("2");

      await changeFilter(id, value);
      expect(lastQuery().get(parameter)).toBe(value);
      expect(lastQuery().get("page")).toBe("1");
    },
  );

  it("debounces search and clears all filters including an initial URL status", async () => {
    vi.useFakeTimers();
    initialSearch = "status=CONFIRMED";
    render();
    await flush();
    expect(lastQuery().get("status")).toBe("CONFIRMED");
    await changeFilter("trip-request-type", "couple");
    await changeFilter("trip-request-level", "essenza");
    await changeFilter("trip-request-payment", "NO_PAYMENT");

    const search = container.querySelector<HTMLInputElement>("input")!;
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(search, "Ana");
      search.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(lastQuery().has("search")).toBe(false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(lastQuery().get("search")).toBe("Ana");

    await act(async () => {
      container
        .querySelector('[data-component="TripRequestsFilters"] button')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(
      Array.from(container.querySelectorAll("select")).map(
        (select) => select.value,
      ),
    ).toEqual(["ALL", "ALL", "ALL", "ALL"]);
    expect(search.value).toBe("");
    for (const parameter of [
      "status",
      "type",
      "level",
      "paymentStatus",
      "search",
    ]) {
      expect(lastQuery().has(parameter)).toBe(false);
    }
    expect(lastQuery().get("page")).toBe("1");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(lastQuery().has("search")).toBe(false);
  });
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
