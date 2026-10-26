import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { CheckoutTripFromApi } from "@/types/Checkout";
import CheckoutPage from "../page";

interface Contact {
  clientSecret: string | null;
  paymentNotice?: string | null;
  onBeforeConfirm: () => Promise<boolean>;
}
const view = vi.hoisted(() => ({ contact: null as Contact | null }));
// Next's AppRouterContext provides one stable router instance.
const router = vi.hoisted(() => ({ replace: vi.fn(), back: vi.fn() }));
const session = vi.hoisted(() => ({
  data: { user: { email: "buyer@example.com" } },
  status: "authenticated",
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams("tripId=trip"),
}));
vi.mock("next-auth/react", () => ({ useSession: () => session }));
vi.mock("@/store/slices/userStore", () => ({ useUserStore: () => ({ isAuthed: true }) }));
vi.mock("@/lib/i18n/dictionaries", () => ({ getDictionary: async (locale: string) => locale === "en" ? en : es }));
vi.mock("@/components/journey/HeaderHero", () => ({ default: () => null }));
vi.mock("@/components/chrome/ChatFab", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/components/app/checkout/CheckoutTravelDetailsCard", () => ({
  CheckoutTravelDetailsCard: () => <section data-checkout-block="trip-details" />,
}));
vi.mock("@/components/app/checkout/CheckoutContactCard", () => ({
  CheckoutContactCard: (props: Contact) => {
    view.contact = props;
    return <section data-checkout-block="contact-payment" />;
  },
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const copy = en.journey.checkout.paymentMode;

describe("checkout payment mode", () => {
  let container: HTMLDivElement;
  let root: Root;
  const fetchMock = vi.fn();
  const trip = {
    id: "trip",
    type: "group",
    level: "essenza",
    pax: 3,
    paxDetails: { adults: 3, minors: 0, rooms: 2 },
    status: "SAVED",
    updatedAt: "2026-10-26",
    basePriceUsd: 1000,
    originCountry: "Argentina",
    originCity: "Buenos Aires",
    startDate: null,
    endDate: null,
    nights: 3,
    transport: "plane",
    climate: "any",
    maxTravelTime: "no-limit",
    departPref: "any",
    arrivePref: "any",
    accommodationType: "any",
    avoidDestinations: [],
    addons: [],
  } as unknown as CheckoutTripFromApi;
  const quoteBodies = () =>
    fetchMock.mock.calls
      .filter(([url]) => url === "/api/stripe/payment-intent")
      .map(([, init]) => JSON.parse(String(init.body)));

  beforeEach(() => {
    view.contact = null;
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url === "/api/trips") return Response.json({ trips: [trip] });
      if (url === "/api/stripe/payment-intent") {
        const body = JSON.parse(String(init?.body));
        const base = {
          paymentIntentId: `pi_${body.paymentMode ?? "TOTAL"}`,
          code: null,
          discountAmount: 0,
          paxDetails: trip.paxDetails,
          level: "essenza",
          totals: { addonsPerPax: 0, basePerPax: 1000, cancelInsurancePerPax: 0, filtersPerPax: 0, totalPerPax: 1023.33, totalTrip: 3070 },
        };
        return Response.json(body.paymentMode === "INDIVIDUAL"
          ? {
              ...base,
              clientSecret: "secret-share",
              paymentMode: "INDIVIDUAL",
              total: 1023.34,
              tripTotal: 3070,
              split: {
                companionEmails: body.companionEmails,
                companionShare: 1023.33,
                maxTopUp: { invitee: 11.67, organizer: 46.66 },
              },
            }
          : { ...base, clientSecret: "secret-total", paymentMode: "TOTAL", total: 3070, tripTotal: 3070 });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  const mount = async () => {
    await act(async () => root.render(<CheckoutPage />));
  };
  const click = async (text: string) => {
    const el = Array.from(container.querySelectorAll("button")).find((b) => b.textContent === text)!;
    await act(async () => el.click());
  };
  const typeEmails = async (...values: string[]) => {
    const inputs = container.querySelectorAll<HTMLInputElement>("input[type=email]");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    for (const [i, value] of values.entries()) {
      await act(async () => {
        setter.call(inputs[i], value);
        inputs[i].dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  };

  it("keeps paying the total as the default", async () => {
    await mount();
    expect(container.textContent).toContain(copy.title);
    expect(view.contact!.clientSecret).toBe("secret-total");
    expect(quoteBodies()[0]).toEqual({ tripId: "trip" });
  });

  it("holds the payment form until the share is calculated, then charges only the share", async () => {
    await mount();
    await click(copy.individualOption);
    expect(view.contact!.clientSecret).toBeNull();
    expect(view.contact!.paymentNotice).toBe(copy.calculateFirst);
    expect(container.querySelectorAll("input[type=email]")).toHaveLength(2);

    await typeEmails("Ana@Example.com", "bo@example.com");
    await click(copy.calculate);
    expect(quoteBodies().at(-1)).toEqual({
      tripId: "trip",
      paymentMode: "INDIVIDUAL",
      companionEmails: ["ana@example.com", "bo@example.com"],
    });
    expect(view.contact!.clientSecret).toBe("secret-share");
    expect(view.contact!.paymentNotice).toBeNull();
    expect(container.textContent).toContain("USD 1023.34");
    expect(container.textContent).toContain("have 72 hours to pay their share");
  });

  it("rejects duplicate emails locally without requesting a quote", async () => {
    await mount();
    await click(copy.individualOption);
    await typeEmails("ana@example.com", "ANA@example.com");
    const before = quoteBodies().length;
    await click(copy.calculate);
    expect(quoteBodies()).toHaveLength(before);
    expect(container.querySelector("[role=alert]")?.textContent).toBe(copy.emailsInvalid);
  });

  it("requires accepting the individual payment terms before paying", async () => {
    await mount();
    await click(copy.individualOption);
    await typeEmails("ana@example.com", "bo@example.com");
    await click(copy.calculate);
    let allowed = true;
    await act(async () => { allowed = await view.contact!.onBeforeConfirm(); });
    expect(allowed).toBe(false);
    expect(container.textContent).toContain(copy.disclaimerRequired);
    await act(async () => container.querySelector<HTMLInputElement>("input[type=checkbox]")!.click());
    expect(container.textContent).not.toContain(copy.disclaimerRequired);
  });

  it("goes back to charging the whole trip when switching to the total", async () => {
    await mount();
    await click(copy.individualOption);
    await typeEmails("ana@example.com", "bo@example.com");
    await click(copy.calculate);
    await click(copy.totalOption);
    expect(quoteBodies().at(-1)).toEqual({ tripId: "trip", paymentMode: "TOTAL" });
    expect(view.contact!.clientSecret).toBe("secret-total");
  });
});
