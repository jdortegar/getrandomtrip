import { describe, expect, it } from "vitest";
import { mapTripFromApi } from "@/lib/utils/trips";
import { getTripPriceParts } from "../dashboard-trip-display";
import { getTripCostDisplay } from "../trip-cost-display";
const raw = {
  id: "trip",
  type: "couple",
  level: "essenza",
  pax: 2,
  basePriceUsd: 1000,
  originCity: "City",
  originCountry: "Country",
  transport: "plane",
  status: "SAVED",
};
describe("attributed trip display", () => {
  it("retains the server base price through API mapping into the unpaid display", () => {
    const trip = mapTripFromApi(raw);
    expect(trip.basePriceUsd).toBe(1000);
    expect(getTripPriceParts(trip)).toMatchObject({
      total: 2000,
      perPerson: 1000,
      isEstimate: true,
    });
  });
  it("shows recorded paid totals without fabricated current-price line items", () => {
    const result = getTripCostDisplay({
      ...raw,
      city: "City",
      country: "Country",
      basePriceUsd: 2000,
      payment: { amount: 1800.5, currency: "EUR", status: "APPROVED" },
    });
    expect(result).toMatchObject({
      total: 1800.5,
      perPerson: 900.25,
      currency: "EUR",
      isEstimate: false,
      breakdown: null,
    });
  });
});

it.each([
  [0, 0],
  [undefined, 700],
])(
  "preserves zero and uses catalog only for missing base %s",
  (basePriceUsd, total) => {
    expect(
      getTripPriceParts(mapTripFromApi({ ...raw, basePriceUsd })).total,
    ).toBe(total);
  },
);
it("applies the PAWS multiplier exactly once", () => {
  expect(
    getTripPriceParts(
      mapTripFromApi({ ...raw, type: "paws", pax: 3, basePriceUsd: 1000 }),
    ),
  ).toMatchObject({ perPerson: 1200, total: 3600 });
});
it("does not treat a pending payment amount as a settled receipt", () => {
  expect(
    getTripPriceParts(
      mapTripFromApi({ ...raw, payment: { amount: 700, status: "PENDING" } }),
    ),
  ).toMatchObject({ perPerson: 1000, total: 2000, isEstimate: true });
});
it("uses recorded paid zero and currency, not today's override", () => {
  expect(
    getTripCostDisplay({
      ...raw,
      city: "",
      country: "",
      payment: { amount: 0, status: "APPROVED", currency: "USD" },
    }),
  ).toMatchObject({ total: 0, breakdown: null, isEstimate: false });
});
it("preserves fixed XSED and not-offered catalog fallback", () => {
  expect(
    getTripPriceParts(
      mapTripFromApi({ ...raw, type: "xsed", basePriceUsd: undefined }),
    ).total,
  ).toBe(500);
  expect(
    getTripPriceParts(
      mapTripFromApi({ ...raw, type: "honeymoon", basePriceUsd: undefined }),
    ).total,
  ).toBe(0);
});
it("shows an attributed unpaid breakdown that adds up including filters", () => {
  const result = getTripCostDisplay({
    ...raw,
    city: "",
    country: "",
    accommodationType: "hotel",
    climate: "warm",
  });
  expect(result.breakdown?.base).toBe(2000);
  expect(
    result.breakdown!.base +
      result.breakdown!.filters +
      result.breakdown!.addons,
  ).toBe(result.total);
});
it("uses persisted headcount with a server quote, rather than a marketing default", () => {
  expect(getTripPriceParts(mapTripFromApi({ ...raw, pax: 3 })).total).toBe(
    3000,
  );
});
it.each(["PARTIALLY_REFUNDED", "CHARGEBACK", "IN_MEDIATION"])(
  "preserves %s recorded history without repricing it as a new quote",
  (status) => {
    const result = getTripCostDisplay({
      ...raw,
      city: "",
      country: "",
      payment: { amount: 1800, currency: "EUR", status },
    });
    expect(result).toEqual({
      total: 1800,
      perPerson: 900,
      currency: "EUR",
      isEstimate: false,
      breakdown: null,
    });
  },
);
it.each([
  "PENDING",
  "PROCESSING",
  "PENDING_WAITING_PAYMENT",
  "PENDING_WAITING_CONFIRMATION",
  "IN_PROCESS",
  "FAILED",
  "CANCELLED",
  "REJECTED",
])("does not represent %s as recorded paid history", (status) => {
  const result = getTripCostDisplay({
    ...raw,
    city: "",
    country: "",
    payment: { amount: 1800, currency: "EUR", status },
  });
  expect(result).toMatchObject({
    total: 2000,
    perPerson: 1000,
    currency: "USD",
    isEstimate: true,
  });
  expect(result.breakdown?.base).toBe(2000);
});
it("preserves a zero recorded chargeback amount instead of today's live quote", () => {
  expect(
    getTripCostDisplay({
      ...raw,
      city: "",
      country: "",
      payment: { amount: 0, currency: "EUR", status: "CHARGEBACK" },
    }),
  ).toEqual({
    total: 0,
    perPerson: 0,
    currency: "EUR",
    isEstimate: false,
    breakdown: null,
  });
});
