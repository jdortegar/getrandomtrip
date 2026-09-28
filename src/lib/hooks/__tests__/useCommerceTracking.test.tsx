import { act, StrictMode, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import AppTracking from "@/components/tracking/AppTracking";
import { saveAnalyticsConsent } from "@/lib/helpers/tracking/consent";
import { trackCustomEvent } from "@/lib/helpers/tracking/gtm";
import { bookingValue } from "@/lib/helpers/tracking/commerce";
import type { CheckoutQuote } from "@/lib/types/CheckoutQuote";
import type { CheckoutResultSummary } from "@/lib/types/CheckoutResult";
import {
  useCheckoutTracking,
  useProductView,
  usePurchaseTracking,
  trackProductSelection,
} from "../useCommerceTracking";

const state = vi.hoisted(() => ({ path: "/journey" }));
vi.mock("next/navigation", () => ({ usePathname: () => state.path }));
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: null }) }));
vi.mock("@/lib/constants/tracking/service-keys", () => ({
  GTM_ID: "GTM-TEST123",
  GA_MEASUREMENT_ID: "G-TEST123",
  ANALYTICS_HOSTNAME: "getrandomtrip.com",
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const quote: CheckoutQuote = {
  paymentIntentId: "pi_checkout",
  clientSecret: "private",
  total: 250,
  code: null,
  discountAmount: 0,
  level: "essenza",
  paxDetails: { adults: 1, minors: 0, rooms: 1 },
  totals: {
    addonsPerPax: 0,
    basePerPax: 250,
    cancelInsurancePerPax: 0,
    filtersPerPax: 0,
    totalPerPax: 250,
    totalTrip: 250,
  },
};
let root: Root;
let container: HTMLDivElement;
let submit: () => void;
let product: string;
let currentQuote: CheckoutQuote | null;
let result: CheckoutResultSummary | null;
let intent: string;
let nextIntent = 0;
function Observer() {
  useProductView(product);
  const onSubmit = useCheckoutTracking(
    "private-booking",
    product,
    currentQuote,
  );
  useEffect(() => {
    submit = onSubmit;
  }, [onSubmit]);
  usePurchaseTracking(intent, result);
  return null;
}
function render(path = state.path) {
  state.path = path;
  window.location.href = `https://getrandomtrip.com${path}?token=private`;
  act(() =>
    root.render(
      <StrictMode>
        <AppTracking />
        <Observer />
      </StrictMode>,
    ),
  );
}
const events = (event: string) =>
  (window.dataLayer as Record<string, unknown>[]).filter(
    (row) => row.event === event,
  );
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  const storage = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  });
  window.dataLayer = [];
  vi.spyOn(document.head, "appendChild").mockImplementation((node) => node);
  state.path = "/journey";
  product = "solo";
  currentQuote = null;
  result = null;
  intent = `pi_test${++nextIntent}`;
  container = document.createElement("div");
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

it("measures current product after opt-in once despite StrictMode/rerenders and strips query strings", () => {
  render();
  expect(events("view_item")).toHaveLength(0);
  act(() => saveAnalyticsConsent("granted"));
  render();
  expect(events("view_item")).toHaveLength(1);
  expect(trackProductSelection("family")).toBe(true);
  product = "family";
  render();
  expect(events("view_item")).toHaveLength(2);
  expect(events("select_item")).toHaveLength(1);
  expect(JSON.stringify(window.dataLayer)).not.toContain("private");
});

it("waits for a successful quote; deduplicates checkout start and validated submission through quote changes/declines", () => {
  saveAnalyticsConsent("granted");
  render("/checkout");
  expect(events("begin_checkout")).toHaveLength(0);
  submit();
  expect(events("add_payment_info")).toHaveLength(0);
  currentQuote = quote;
  render();
  render();
  expect(events("begin_checkout")).toHaveLength(1);
  submit();
  submit();
  currentQuote = { ...quote, total: 225 };
  render();
  submit();
  expect(events("begin_checkout")).toHaveLength(1);
  expect(events("add_payment_info")).toHaveLength(1);
  expect(events("purchase")).toHaveLength(0);
  expect(events("page_view")).toHaveLength(0);
  expect(events("view_item")).toHaveLength(0);
});

it("does not mark rejected submissions sent; consent enables the next actual submit, not a replay", () => {
  currentQuote = quote;
  render("/checkout");
  submit();
  expect(events("add_payment_info")).toHaveLength(0);
  act(() => saveAnalyticsConsent("granted"));
  expect(events("begin_checkout")).toHaveLength(1);
  expect(events("add_payment_info")).toHaveLength(0);
  submit();
  expect(events("add_payment_info")).toHaveLength(1);
});

it("retries verified purchase on same-mount consent grant without duplicating or exposing private summary fields", () => {
  result = {
    trip: { type: "solo", status: "CONFIRMED", id: "private" },
    payment: { status: "APPROVED", amount: 250, currency: "usd" },
  } as CheckoutResultSummary;
  render("/checkout/success");
  expect(events("purchase")).toHaveLength(0);
  act(() => saveAnalyticsConsent("granted"));
  expect(events("purchase")).toHaveLength(1);
  expect(events("purchase")[0]).toMatchObject({
    transaction_id: intent,
    ...bookingValue("solo", 250),
  });
  act(() => saveAnalyticsConsent("denied"));
  act(() => saveAnalyticsConsent("granted"));
  render();
  expect(events("purchase")).toHaveLength(1);
  expect(JSON.stringify(window.dataLayer)).not.toContain("private");
});

it.each(["PENDING", "FAILED", "REFUNDED"])(
  "never tracks an unapproved %s payment",
  (status) => {
    saveAnalyticsConsent("granted");
    result = {
      trip: { type: "solo", status: "CONFIRMED" },
      payment: { status, amount: 250, currency: "usd" },
    } as CheckoutResultSummary;
    render("/checkout/success");
    expect(events("purchase")).toHaveLength(0);
    expect(
      trackCustomEvent({
        event: "begin_checkout",
        ...bookingValue("solo", 250),
      }),
    ).toBe(false);
  },
);
