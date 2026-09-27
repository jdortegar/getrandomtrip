import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { UpcomingTripsList } from "../UpcomingTripsList";
import { TravelerTripsTable } from "../TravelerTripsTable";
import { UnpaidTripsAlert } from "../../UnpaidTripsAlert";
import copy from "@/dictionaries/en.json";
import type { Trip } from "@/lib/utils/trips";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

it.each(["CONFIRMED", "REVEALED"])(
  "dashboard cards and table enforce %s visibility even with stale API data",
  (status) => {
    const trip: Trip = {
      id: "trip",
      type: "couple",
      level: "essenza",
      status,
      actualDestination: "Secret city",
      startDate: "2027-01-01",
      endDate: "2027-01-03",
      city: "Origin",
      country: "Country",
      pax: 2,
      totalTripUsd: 700,
    };
    const container = document.createElement("div");
    const root = createRoot(container);
    try {
      act(() =>
        root.render(
          <>
            <UnpaidTripsAlert
              copy={copy.dashboard}
              locale="en"
              onDelete={vi.fn()}
              trips={[trip]}
            />
            <UpcomingTripsList
              copy={copy.dashboard}
              locale="en"
              trips={[trip]}
            />
            <TravelerTripsTable
              copy={copy.dashboard}
              filter="all"
              locale="en"
              onFilterChange={vi.fn()}
              onPageChange={vi.fn()}
              page={1}
              pageCopy={copy.travelerDashboard.trips}
              paginationCopy={copy.common.pagination}
              total={1}
              totalPages={1}
              trips={[trip]}
            />
          </>,
        ),
      );
      for (const component of [
        "UpcomingTripsList",
        "TravelerTripsTable",
        "UnpaidTripsAlert",
      ]) {
        const text = container.querySelector(
          `[data-component="${component}"]`,
        )!.textContent;
        expect(text).toContain("Jan 1, 2027");
        expect(text).not.toContain("Dec 31, 2026");
        if (component === "UnpaidTripsAlert") continue;
        if (status === "REVEALED") expect(text).toContain("Secret city");
        else {
          expect(text).not.toContain("Secret city");
          expect(text).toContain(copy.dashboard.allTrips.emptyDestination);
        }
      }
    } finally {
      act(() => root.unmount());
    }
  },
);
