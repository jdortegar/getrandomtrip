import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TravelerTripsTable,
  type StatusFilter,
} from "@/components/app/dashboard/traveler/TravelerTripsTable";
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";
import type { Locale } from "@/lib/i18n/config";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let container: HTMLDivElement;
let root: Root;

function render(locale: Locale, filter: StatusFilter = "all", total = 0) {
  const dict = locale === "en" ? enCopy : esCopy;
  const onFilterChange = vi.fn();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <TravelerTripsTable
        copy={dict.dashboard}
        filter={filter}
        locale={locale}
        onFilterChange={onFilterChange}
        onPageChange={vi.fn()}
        page={1}
        pageCopy={dict.travelerDashboard.trips}
        paginationCopy={dict.common.pagination}
        total={total}
        totalPages={1}
        trips={[]}
      />,
    );
  });
  return onFilterChange;
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
});

it.each(["en", "es"] as const)(
  "uses the shared controlled status dropdown in %s",
  (locale) => {
    const onFilterChange = render(locale, "upcoming", 1);
    const copy = (locale === "en" ? enCopy : esCopy).travelerDashboard.trips;
    const select = container.querySelector<HTMLSelectElement>(
      '[data-component="TableFilterToolbar"] select',
    );
    expect(select).not.toBeNull();
    expect(select!.value).toBe("upcoming");
    expect(select!.getAttribute("aria-label")).toBe(
      locale === "en" ? "Trip status" : "Estado del viaje",
    );
    expect(
      container.querySelector(`label[for="${select!.id}"]`)?.textContent,
    ).toBe(copy.filterLabel);
    expect(
      container.querySelector('[data-component="TableFilterToolbar"] button')
        ?.textContent,
    ).toContain(copy.clearFilters);
    expect(select!.className).toContain("cursor-pointer");
    expect(select!.className).toContain("focus:ring-primary/20");
    expect(
      Array.from(select!.options).map((option) => [option.value, option.text]),
    ).toEqual([
      ["all", copy.filterAll],
      ["upcoming", copy.filterUpcoming],
      ["completed", copy.filterCompleted],
    ]);
    act(() => {
      select!.value = "completed";
      select!.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith("completed");
  },
);

describe("TravelerTripsTable — empty-state journey link", () => {
  it.each([
    { locale: "en" as const, href: "/en/journey", copy: enCopy },
    { locale: "es" as const, href: "/journey", copy: esCopy },
  ])(
    "keeps the $locale locale when starting a journey",
    ({ locale, href, copy }) => {
      render(locale);

      const link = container.querySelector("a");
      expect(link?.getAttribute("href")).toBe(href);
      expect(link?.textContent).toBe(copy.dashboard.upcomingTrips.emptyCta);
    },
  );

  it.each(["upcoming", "completed"] as const)(
    "does not show the first-trip CTA for an empty %s filter",
    (filter) => {
      render("en", filter);

      expect(container.querySelector("a")).toBeNull();
      expect(container.querySelector("table")).not.toBeNull();
    },
  );

  it("does not show the first-trip CTA when the unfiltered total is nonzero", () => {
    render("en", "all", 1);

    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("table")).not.toBeNull();
  });
});

it.each(["en", "es"] as const)(
  "localizes experience/type/search controls and includes XSED in %s",
  (locale) => {
    render(locale, "all", 1);
    const selects = container.querySelectorAll("select");
    expect(selects).toHaveLength(3);
    expect(Array.from(selects).map((select) => select.options[0].text)).toEqual(
      Array(3).fill(locale === "en" ? "All" : "Todos"),
    );
    expect(selects[1].getAttribute("aria-label")).toBe(
      locale === "en" ? "Experience" : "Experiencia",
    );
    expect(selects[1].options[1].value).toBe("xsed");
    expect(
      Array.from(selects[2].options).map((option) => option.value),
    ).toEqual(
      expect.arrayContaining([
        "all",
        "solo",
        "couple",
        "family",
        "group",
        "honeymoon",
        "paws",
        "xsed",
      ]),
    );
    expect(selects[2].getAttribute("aria-label")).toBe(
      locale === "en" ? "Travel type" : "Tipo de viaje",
    );
    for (const control of container.querySelectorAll("select,input")) {
      expect(
        container.querySelector(`label[for="${control.id}"]`)?.textContent,
      ).toBe(control.getAttribute("aria-label"));
    }
    const input = container.querySelector('input[type="search"]');
    expect(input?.getAttribute("placeholder")).toBe(
      locale === "en"
        ? "Search by origin or trip reference"
        : "Buscar por origen o referencia del viaje",
    );
  },
);
