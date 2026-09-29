import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { TravelerTripRow } from "../TravelerTripRow";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { Trip } from "@/lib/utils/trips";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(
  status: string,
  locale: "en" | "es",
  overrides: Partial<Trip> = {},
) {
  const trip: Trip = {
    id: "trip-id",
    type: "couple",
    level: "essenza",
    status,
    city: "Origin",
    country: "Country",
    actualDestination: "Secret city",
    startDate: "2027-01-01",
    endDate: "2027-01-03",
    pax: 2,
    totalTripUsd: 700,
    reviewToken: "review-token",
    ...overrides,
  };
  act(() =>
    root.render(
      <table>
        <tbody>
          <TravelerTripRow
            copy={(locale === "en" ? en : es).dashboard}
            locale={locale}
            trip={trip}
          />
        </tbody>
      </table>,
    ),
  );
}

it.each([
  ["CONFIRMED", "en"],
  ["REVEALED", "en"],
  ["COMPLETED", "en"],
  ["CANCELLED", "en"],
  ["CONFIRMED", "es"],
  ["REVEALED", "es"],
  ["COMPLETED", "es"],
  ["CANCELLED", "es"],
] as const)(
  "preserves %s row links, fulfillment and dates in %s",
  (status, locale) => {
    render(status, locale);
    const prefix = locale === "en" ? "/en" : "";
    const links = Array.from(container.querySelectorAll("a")).map((link) =>
      link.getAttribute("href"),
    );
    const action =
      status === "CONFIRMED" || status === "REVEALED"
        ? `${prefix}/dashboard/trips/trip-id/reveal`
        : status === "COMPLETED"
          ? `${prefix}/review/review-token`
          : null;
    expect(links).toEqual([
      ...(action ? [action] : []),
      `${prefix}/dashboard/trips/trip-id`,
    ]);
    const copy = (locale === "en" ? en : es).dashboard;
    expect(container.textContent).toContain(copy.tripStatus[status]);
    expect(container.textContent).toContain(
      locale === "en" ? "Jan 1, 2027" : "1 ene 2027",
    );
    if (status === "CONFIRMED") {
      expect(container.textContent).not.toContain("Secret city");
      expect(container.textContent).toContain(copy.allTrips.emptyDestination);
    } else expect(container.textContent).toContain("Secret city");
  },
);

it.each([{ reviewSubmittedAt: "2027-01-04" }, { reviewToken: null }])(
  "omits review actions when unavailable: %j",
  (overrides) => {
    render("COMPLETED", "en", overrides);
    expect(container.querySelector('a[href*="/review/"]')).toBeNull();
    expect(
      container.querySelector('a[href="/en/dashboard/trips/trip-id"]'),
    ).not.toBeNull();
  },
);

it.each(["en", "es"] as const)("capitalizes the raw XSED level fallback in %s", (locale) => {
  render("CONFIRMED", locale, { level: "Xsed" });
  const level = container.querySelector("tbody td p:nth-child(2)");
  expect(level?.textContent).toBe("XSED");
  expect(level?.querySelector("span")).toBeNull();
});
