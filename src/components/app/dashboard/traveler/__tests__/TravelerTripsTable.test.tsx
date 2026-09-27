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
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <TravelerTripsTable
        copy={dict.dashboard}
        filter={filter}
        locale={locale}
        onFilterChange={vi.fn()}
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
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
});

describe("TravelerTripsTable — empty-state journey link", () => {
  it.each([
    { locale: "en" as const, href: "/en/journey", copy: enCopy },
    { locale: "es" as const, href: "/journey", copy: esCopy },
  ])("keeps the $locale locale when starting a journey", ({ locale, href, copy }) => {
    render(locale);

    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe(href);
    expect(link?.textContent).toBe(copy.dashboard.upcomingTrips.emptyCta);
  });

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
