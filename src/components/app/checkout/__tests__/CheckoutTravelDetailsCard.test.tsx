import { act, type ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import { CheckoutTravelDetailsCard } from "../CheckoutTravelDetailsCard";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
it("retains price and editable travelers without invented review claims", () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  const props = {
    addonsPerPaxCombined: 0,
    appliedPromocode: null,
    basePerPax: 350,
    checkoutCopy: en.journey.checkout,
    checkoutIconDetailRows: [],
    checkoutItemTileClass: "",
    checkoutItemTileLabelClass: "",
    filterFeeDescription: "",
    filterFeePaxLine: "",
    filtersPerPax: 0,
    onApplyPromocode: vi.fn(),
    onPromocodeChange: vi.fn(),
    onRemovePromocode: vi.fn(),
    onSaveTravelers: vi.fn(),
    onTogglePromocodeInput: vi.fn(),
    partyEditable: true,
    paxDetails: { adults: 2, minors: 0, rooms: 1 },
    pricePerPerson: 350,
    promoDiscount: 0,
    promoError: null,
    promoLoading: false,
    promocode: "",
    selectedExperienceLabel: "Essenza",
    selectedTravelTypeInfo: { label: "Couple", rating: 7, reviews: 10 },
    ratingFormatted: "7.0",
    showPromocodeInput: false,
    summary: en.journey.summary,
    totalPerPax: 350,
    totalTrip: 700,
    usd: (n: number) => `USD ${n}`,
  } as ComponentProps<typeof CheckoutTravelDetailsCard>;
  try {
    act(() => root.render(<CheckoutTravelDetailsCard {...props} />));
    expect(container.textContent).not.toContain(
      en.journey.summary.favoriteAmongTravelers,
    );
    expect(container.textContent).not.toContain("7.0 (10)");
    expect(container.textContent).toContain("USD 350");
    expect(container.textContent).toContain("USD 700");
    expect(
      container.querySelector(
        'button[data-component="CheckoutTravelersSummarySection"]',
      )?.textContent,
    ).toContain(en.journey.checkout.travelersTileTitle);
  } finally {
    act(() => root.unmount());
  }
});

it("keeps the USD total primary and adds the ≈ local total when selected", async () => {
  const { CurrencyProvider } = await import("@/components/providers/CurrencyProvider");
  document.cookie = "GRT_DISPLAY_CURRENCY=LOCAL; path=/";
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ local: { currency: "ARS", rate: 1000 } }))),
  );
  const container = document.createElement("div");
  const root = createRoot(container);
  const props = {
    addonsPerPaxCombined: 0,
    appliedPromocode: null,
    basePerPax: 350,
    checkoutCopy: en.journey.checkout,
    checkoutIconDetailRows: [],
    checkoutItemTileClass: "",
    checkoutItemTileLabelClass: "",
    filterFeeDescription: "",
    filterFeePaxLine: "",
    filtersPerPax: 0,
    onApplyPromocode: vi.fn(),
    onPromocodeChange: vi.fn(),
    onRemovePromocode: vi.fn(),
    onSaveTravelers: vi.fn(),
    onTogglePromocodeInput: vi.fn(),
    partyEditable: true,
    paxDetails: { adults: 2, minors: 0, rooms: 1 },
    pricePerPerson: 350,
    promoDiscount: 0,
    promoError: null,
    promoLoading: false,
    promocode: "",
    selectedExperienceLabel: "Essenza",
    selectedTravelTypeInfo: { label: "Couple", rating: 7, reviews: 10 },
    ratingFormatted: "7.0",
    showPromocodeInput: false,
    summary: en.journey.summary,
    totalPerPax: 350,
    totalTrip: 700,
    usd: (n: number) => `USD ${n}`,
  } as ComponentProps<typeof CheckoutTravelDetailsCard>;
  try {
    await act(async () =>
      root.render(
        <CurrencyProvider copy={en.currency} locale="en">
          <CheckoutTravelDetailsCard {...props} />
        </CurrencyProvider>,
      ),
    );
    const text = container.textContent?.replace(/ /g, " ");
    expect(text).toContain("USD 700");
    expect(text).toContain("≈ ARS 700,000");
  } finally {
    act(() => root.unmount());
    vi.unstubAllGlobals();
    document.cookie = "GRT_DISPLAY_CURRENCY=; path=/; max-age=0";
  }
});
