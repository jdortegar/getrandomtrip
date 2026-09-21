import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { TripCostSummary } from "../TripCostSummary";
import { getTripCostDisplay } from "@/lib/helpers/trip-cost-display";
const copy = {
  costsTitle: "Costs",
  basePriceLabel: "Base",
  filtersCostLabel: "Filters",
  addonsCostLabel: "Add-ons",
  totalTripLabel: "Total",
  perPersonLabel: "Per person",
  estimateNote: "Estimate",
};
const trip = {
  type: "couple",
  level: "essenza",
  pax: 2,
  basePriceUsd: 1000,
  city: "City",
  country: "Country",
  transport: "plane",
};
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
it("renders the paid currency and recorded amount without invented current line items", () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() =>
    root.render(
      <TripCostSummary
        copy={copy}
        price={getTripCostDisplay({
          ...trip,
          basePriceUsd: 3000,
          payment: { amount: 1800, currency: "EUR", status: "APPROVED" },
        })}
      />,
    ),
  );
  expect(container.textContent).toContain("EUR 1800.00");
  expect(container.textContent).toContain("EUR 900.00");
  expect(container.textContent).not.toContain("Base");
  expect(container.textContent).not.toContain("Estimate");
  act(() => root.unmount());
});
it("renders the attributed live breakdown as an estimate", () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() =>
    root.render(
      <TripCostSummary copy={copy} price={getTripCostDisplay(trip)} />,
    ),
  );
  expect(container.textContent).toContain("BaseUSD 2000.00");
  expect(container.textContent).toContain("FiltersUSD 0.00");
  expect(container.textContent).toContain("TotalEstimateUSD 2000.00");
  act(() => root.unmount());
});
