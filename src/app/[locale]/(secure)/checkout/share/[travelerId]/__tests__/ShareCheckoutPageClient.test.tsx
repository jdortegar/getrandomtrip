import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { ShareCheckoutView } from "@/types/payments";

const form = vi.hoisted(() => ({ props: null as Record<string, unknown> | null }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));
vi.mock("@/components/journey/HeaderHero", () => ({
  default: ({ title, description }: { title: string; description: string }) => (
    <header data-testid="hero">
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  ),
}));
vi.mock("@/lib/stripe-client", () => ({ getStripePromise: () => Promise.resolve(null) }));
vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/app/checkout/StripePaymentForm", () => ({
  StripePaymentForm: (props: Record<string, unknown>) => {
    form.props = props;
    return <form data-testid="payment-form" />;
  },
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

import { ShareCheckoutPageClient } from "../ShareCheckoutPageClient";

const view: ShareCheckoutView = {
  travelerId: "traveler-ana",
  state: "pay",
  amount: 1023.33,
  currency: "USD",
  paymentDeadlineLabel: "October 30, 2026 at 09:00",
  maxTopUp: 11.67,
  organizerFirstName: "Lucía",
  billingEmail: "ana@example.com",
  billingName: "Ana Paz",
  billingPhone: "",
  billingLine1: "",
  billingCity: "",
  billingState: "",
  billingPostalCode: "",
  billingCountry: "",
  trip: {
    type: "group",
    level: "essenza",
    originCity: "Buenos Aires",
    originCountry: "Argentina",
    startDate: "2026-12-03",
    nights: 4,
    transport: "plane",
    climate: "warm",
    addons: [{ id: "car-rental", qty: 2 }],
  },
};
const copy = en.shareCheckout;

describe("ShareCheckoutPageClient", () => {
  let root: Root;
  let container: HTMLDivElement;
  const fetchMock = vi.fn();
  beforeEach(() => {
    form.props = null;
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    container = document.createElement("div");
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    vi.unstubAllGlobals();
  });
  const render = async (overrides: Partial<ShareCheckoutView> = {}, dict = en) => {
    await act(async () =>
      root.render(
        <ShareCheckoutPageClient
          checkoutCopy={dict.journey.checkout}
          copy={dict.shareCheckout}
          rowsCopy={{ journey: dict.journey, tripTransport: dict.tripTransport, xsedBook: dict.xsedBook }}
          summary={dict.journey.summary}
          locale={dict === en ? "en" : "es"}
          paymentCopy={{ ...dict.journey.checkout }}
          view={{ ...view, ...overrides }}
        />,
      ),
    );
  };

  it("shows the share, the deadline, and a payment form that returns here", async () => {
    fetchMock.mockResolvedValue(Response.json({ clientSecret: "secret_share" }));
    await render();
    expect(fetchMock).toHaveBeenCalledWith("/api/stripe/share-intent", expect.objectContaining({
      body: JSON.stringify({ travelerId: "traveler-ana" }),
    }));
    expect(container.textContent).toContain("Lucía put this trip together");
    expect(container.textContent).toContain("USD 1023.33");
    expect(container.textContent).toContain("You have until October 30, 2026 at 09:00 to pay.");
    expect(container.textContent).toContain("so you could pay up to USD 11.67 more.");
    expect(form.props).toMatchObject({
      billingEmail: "ana@example.com",
      collectBillingDetails: true,
      returnPath: "/checkout/share/traveler-ana",
    });
  });

  it.each([
    ["already paid", { paid: true }, copy.paidTitle],
    ["past the deadline", { errorCode: "DEADLINE_PASSED" }, copy.closedTitle],
  ])("switches state when the share is %s", async (_label, body, title) => {
    fetchMock.mockResolvedValue(Response.json(body, { status: "paid" in body ? 200 : 409 }));
    await render();
    expect(container.textContent).toContain(title);
    expect(form.props).toBeNull();
  });

  it("offers a retry when the payment cannot be prepared", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ error: "boom" }, { status: 500 }));
    fetchMock.mockResolvedValueOnce(Response.json({ clientSecret: "secret_share" }));
    await render();
    expect(container.querySelector("[role=alert]")?.textContent).toContain(copy.errorMessage);
    await act(async () => container.querySelector<HTMLButtonElement>("[role=alert] button")!.click());
    expect(form.props).not.toBeNull();
  });

  it("renders paid and closed pages without requesting a payment, in both locales", async () => {
    await render({ state: "paid" });
    expect(container.textContent).toContain(copy.paidTitle);
    await render({ state: "closed" }, es);
    expect(container.textContent).toContain(es.shareCheckout.closedTitle);
    expect(container.textContent).toContain("habla con Lucía");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("says the trip adjusts without promising a cost change when nothing can rise", async () => {
    fetchMock.mockResolvedValue(Response.json({ clientSecret: "secret_share" }));
    await render({ maxTopUp: 0 });
    expect(container.textContent).toContain(copy.disclaimerNoCost);
    expect(container.textContent).not.toContain("could pay up to");
  });

  it("uses the trip checkout layout: hero, trip summary and payment cards, without the trip price", async () => {
    fetchMock.mockResolvedValue(Response.json({ clientSecret: "secret_share" }));
    await render();
    expect(container.querySelector("[data-testid=hero]")?.textContent).toContain(copy.title);
    const tripCard = container.querySelector("[data-component=ShareCheckoutTripCard]")!;
    expect(tripCard.textContent).toContain(en.journey.checkout.travelDetailsTitle);
    expect(tripCard.textContent).toContain("Buenos Aires, Argentina.");
    expect(tripCard.textContent).toContain(en.journey.summary.datesSection);
    expect(tripCard.textContent).not.toContain("USD");
    const paymentCard = container.querySelector("[data-component=ShareCheckoutPaymentCard]")!;
    expect(paymentCard.textContent).toContain(en.journey.checkout.paymentTitle);
    expect(paymentCard.textContent).toContain("USD 1023.33");
  });

  it("shows the checkout's trip detail rows, with add-on names but no prices", async () => {
    fetchMock.mockResolvedValue(Response.json({ clientSecret: "secret_share" }));
    await render();
    const tripCard = container.querySelector("[data-component=ShareCheckoutTripCard]")!;
    const text = tripCard.textContent ?? "";
    for (const label of [
      en.journey.summary.experienceSection,
      en.journey.summary.originSection,
      en.journey.summary.datesSection,
      en.journey.summary.transportSection,
    ]) {
      expect(text).toContain(label);
    }
    expect(text).toContain(en.journey.summary.filterLabelClimate);
    expect(text).toContain(en.journey.addons["car-rental"].title);
    expect(text).not.toMatch(/USD|%/);
  });
});

