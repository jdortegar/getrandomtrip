import { act, isValidElement } from "react";
import { Car } from "lucide-react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import en from "@/dictionaries/en.json";
import type { PaxDetails } from "@/lib/types/PaxDetails";
import type { CheckoutTripFromApi } from "@/types/Checkout";
import type { CheckoutIconDetailRow } from "@/components/app/checkout/CheckoutTravelDetailsCard";
import {
  getCheckoutLevel,
  getCheckoutPaxDetails,
} from "@/lib/helpers/checkout-party";
import CheckoutPage from "../page";
import * as tracking from "@/lib/helpers/tracking/gtm";
import { saveAnalyticsConsent } from "@/lib/helpers/tracking/consent";

interface Details {
  checkoutIconDetailRows: CheckoutIconDetailRow[];
  paxDetails: PaxDetails;
  totalTrip: number;
  promoDiscount: number;
  partyEditable: boolean;
  pricePerPerson: number;
  selectedExperienceLabel: string;
  onSaveTravelers: (party: PaxDetails) => Promise<void>;
  onPromocodeChange: (code: string) => void;
  onApplyPromocode: () => Promise<void>;
}
const navigation = vi.hoisted(() => ({
  locale: "en",
  // Next's AppRouterContext provides one stable publicAppRouterInstance.
  router: { replace: vi.fn(), back: vi.fn() },
}));
interface Contact {
  onPaymentInfoSubmitted: () => void;
  paymentRecoveryHref?: string;
  clientSecret: string | null;
  paymentError: string | null;
  onRetryPayment: () => void;
}
const view = vi.hoisted(() => ({
  details: null as Details | null,
  contact: null as Contact | null,
}));
const session = vi.hoisted(() => ({
  data: { user: { email: "buyer@example.com" } },
  status: "authenticated",
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: navigation.locale }),
  useRouter: () => navigation.router,
  useSearchParams: () => new URLSearchParams("tripId=trip"),
}));
vi.mock("next-auth/react", () => ({ useSession: () => session }));
vi.mock("@/store/slices/userStore", () => ({
  useUserStore: () => ({ isAuthed: true }),
}));
vi.mock("@/lib/i18n/dictionaries", () => ({ getDictionary: async (locale: string) => locale === "en" ? en : es }));
vi.mock("@/components/journey/HeaderHero", () => ({ default: () => null }));
vi.mock("@/components/chrome/ChatFab", () => ({ default: () => null }));
vi.mock("@/components/app/checkout/CheckoutTravelDetailsCard", () => ({
  CheckoutTravelDetailsCard: (props: Details) => {
    view.details = props;
    return <section data-checkout-block="trip-details" />;
  },
}));
vi.mock("@/components/app/checkout/CheckoutContactCard", () => ({
  CheckoutContactCard: (props: Contact) => {
    view.contact = props;
    return <section data-checkout-block="contact-payment" />;
  },
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe("checkout traveler handoff and quote synchronization", () => {
  let trip: CheckoutTripFromApi;
  let container: HTMLDivElement;
  let root: Root;
  let promo: string | null;
  const fetchMock = vi.fn();
  beforeEach(() => {
    navigation.locale = "en";
    navigation.router.replace.mockReset();
    navigation.router.back.mockReset();
    promo = null;
    trip = {
      id: "trip",
      type: "xsed",
      level: "family",
      pax: 2,
      paxDetails: { adults: 3, minors: 2, rooms: 2 },
      status: "SAVED",
      updatedAt: "2026-09-25",
      basePriceUsd: 250,
      originCountry: "Argentina",
      originCity: "Buenos Aires",
      startDate: null,
      endDate: null,
      nights: 1,
      transport: "plane",
      climate: "any",
      maxTravelTime: "no-limit",
      departPref: "any",
      arrivePref: "any",
      accommodationType: "any",
      avoidDestinations: [],
      addons: [],
    };
    view.details = null;
    view.contact = null;
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url === "/api/trips") return Response.json({ trips: [trip] });
      const body = JSON.parse(String(init?.body));
      if (url === "/api/trip-requests") {
        trip = { ...trip, ...body };
        trip.level = getCheckoutLevel(trip);
        return Response.json({ tripRequest: trip });
      }
      if (url === "/api/stripe/payment-intent") {
        if ("promoCode" in body) promo = body.promoCode;
        const party = getCheckoutPaxDetails(trip);
        const level = getCheckoutLevel(trip);
        const basePrice = level === "solo" ? 350 : 250;
        const totalTrip = (party.adults + party.minors) * basePrice;
        const discountAmount = promo ? totalTrip * 0.1 : 0;
        return Response.json({
          clientSecret: `secret-${totalTrip}-${promo}`,
          paymentIntentId: "pi_test",
          code: promo,
          discountAmount,
          total: totalTrip - discountAmount,
          paxDetails: party,
          level,
          totals: {
            addonsPerPax: 0,
            basePerPax: basePrice,
            cancelInsurancePerPax: 0,
            filtersPerPax: 0,
            totalPerPax: basePrice,
            totalTrip,
          },
        });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    container = document.createElement("div");
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
  const mount = async () => {
    await act(async () => root.render(<CheckoutPage />));
  };

  it.each([
    ["en", "plane", "Own car"],
    ["en", "own-car", "Own car"],
    ["es", "plane", "Auto propio"],
    ["es", "own-car", "Auto propio"],
  ])("shows XSED %s/%s as localized own-car transport", async (locale, transport, expected) => {
    navigation.locale = locale;
    trip.transport = transport;
    await mount();
    const row = view.details!.checkoutIconDetailRows.find((item) => item.id === "transport")!;
    expect(row.value).toBe(expected);
    expect(isValidElement(row.icon) && row.icon.type).toBe(Car);
    expect(view.details!.totalTrip).toBe(500);
    expect(fetchMock.mock.calls.some(([url]) => url === "/api/trip-requests")).toBe(false);
  });

  it("keeps the initial trip request count bounded on an unchanged rerender", async () => {
    await mount();
    const initialTripRequests = fetchMock.mock.calls.filter(([url]) => url === "/api/trips").length;
    // Loading the dictionary can replace the initial request once; unrelated renders cannot.
    expect(initialTripRequests).toBeGreaterThan(0);
    expect(initialTripRequests).toBeLessThanOrEqual(2);
    await mount();
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/trips")).toHaveLength(initialTripRequests);
  });

  it("retains the regular journey transport label", async () => {
    trip.type = "couple";
    trip.level = "essenza";
    trip.transport = "train";
    await mount();
    const row = view.details!.checkoutIconDetailRows.find((item) => item.id === "transport")!;
    expect(row.value).toBe("Train");
    expect(isValidElement(row.icon) && row.icon.type).not.toBe(Car);
  });

  it("wires one checkout initiation and payment-info callback to the actual server quote", async () => {
    const storage = new Map<string, string>();
    Object.defineProperty(window, "localStorage", { configurable: true, value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    } });
    saveAnalyticsConsent("granted");
    const event = vi.spyOn(tracking, "trackCustomEvent").mockReturnValue(true);
    await mount();
    expect(event).toHaveBeenCalledWith(expect.objectContaining({
      event: "begin_checkout", value: view.details!.totalTrip, currency: "USD",
      items: [expect.objectContaining({ item_id: "trip-xsed", quantity: 1 })],
    }));
    view.contact!.onPaymentInfoSubmitted();
    view.contact!.onPaymentInfoSubmitted();
    expect(event.mock.calls.filter(([payload]) => payload.event === "add_payment_info")).toHaveLength(1);
  });

  it.each(["en", "es"])("localizes invalid dates and offers dashboard recovery in %s", async (locale) => {
    navigation.locale = locale;
    const copy = locale === "en" ? en : es;
    fetchMock.mockImplementation(async (url: string) => url === "/api/trips"
      ? Response.json({ trips: [trip] })
      : Response.json({ error: "Departure must be at least 7 calendar days from today", errorCode: "INVALID_TRIP_DATES" }, { status: 400 }));
    await mount();
    expect(view.contact?.paymentError).toBe(copy.journey.checkout.errors.invalidDates);
    expect(view.contact?.paymentRecoveryHref).toBe(`/${locale}/dashboard/traveler`);
    expect(view.contact?.clientSecret).toBeNull();
    expect(fetchMock.mock.calls.every(([, init]) => !init || JSON.parse(init.body).tripId === "trip")).toBe(true);
  });

  it("does not pass fabricated ratings into checkout details", async () => {
    await act(async () => root.render(<CheckoutPage />));
    expect(view.details).not.toHaveProperty("ratingFormatted");
    expect(view.details).not.toHaveProperty("selectedTravelTypeInfo.rating");
    expect(view.details).not.toHaveProperty("selectedTravelTypeInfo.reviews");
    expect(view.details?.pricePerPerson).toBe(250);
  });

  it("renders trip details before contact and payment in document order", async () => {
    await mount();
    const blocks = container.querySelectorAll("[data-checkout-block]");
    expect(
      Array.from(blocks, (block) => block.getAttribute("data-checkout-block")),
    ).toEqual(["trip-details", "contact-payment"]);
  });

  it("hydrates the selected scalar count instead of a stale party and saves before refreshing", async () => {
    await mount();
    expect(view.details?.paxDetails).toMatchObject({
      adults: 2,
      minors: 0,
      rooms: 1,
    });
    expect(view.details?.totalTrip).toBe(500);
    fetchMock.mockClear();
    await act(async () =>
      view.details!.onSaveTravelers({ adults: 3, minors: 2, rooms: 2 }),
    );
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/trip-requests",
      "/api/stripe/payment-intent",
    ]);
    expect(trip.pax).toBe(5);
    expect(view.details?.totalTrip).toBe(1250);
    expect(view.contact?.clientSecret).toBe("secret-1250-null");
  });

  it.each(["legacy", "save"])(
    "reconciles %s one-person XSED with Solo display and USD350 pricing",
    async (source) => {
      if (source === "legacy") trip.pax = 1;
      await mount();
      if (source === "save")
        await act(async () =>
          view.details!.onSaveTravelers({ adults: 1, minors: 0, rooms: 1 }),
        );
      expect(view.details?.paxDetails).toMatchObject({ adults: 1, minors: 0 });
      expect(view.details?.totalTrip).toBe(350);
      expect(view.details?.pricePerPerson).toBe(350);
      expect(view.details?.selectedExperienceLabel).toBe("Solo");
      expect(view.details?.partyEditable).toBe(false);
      expect(view.contact?.clientSecret).toBe("secret-350-null");
    },
  );

  it("uses a refreshed percentage discount and keeps rooms out of the charge", async () => {
    await mount();
    act(() => view.details!.onPromocodeChange("TEN"));
    await act(async () => view.details!.onApplyPromocode());
    expect(view.details?.promoDiscount).toBe(50);
    await act(async () =>
      view.details!.onSaveTravelers({ adults: 3, minors: 1, rooms: 1 }),
    );
    expect(view.details?.promoDiscount).toBe(100);
    expect(view.details?.totalTrip).toBe(1000);
    const secret = view.contact?.clientSecret;
    await act(async () =>
      view.details!.onSaveTravelers({ adults: 3, minors: 1, rooms: 2 }),
    );
    expect(view.details?.totalTrip).toBe(1000);
    expect(view.contact?.clientSecret).toBe(secret);
  });

  it("blocks payment after a quote failure and restores it only after retry", async () => {
    await mount();
    fetchMock.mockImplementationOnce(async () =>
      Response.json({ tripRequest: trip }),
    );
    fetchMock.mockRejectedValueOnce(new Error("Quote unavailable"));
    await act(async () => {
      await view
        .details!.onSaveTravelers({ adults: 3, minors: 0, rooms: 1 })
        .catch(() => {});
    });
    expect(view.contact?.clientSecret).toBeNull();
    expect(view.contact?.paymentError).toBe("Quote unavailable");
    await act(async () => view.contact!.onRetryPayment());
    expect(view.contact?.clientSecret).toBe("secret-750-null");
    expect(view.contact?.paymentError).toBeNull();
  });
});
