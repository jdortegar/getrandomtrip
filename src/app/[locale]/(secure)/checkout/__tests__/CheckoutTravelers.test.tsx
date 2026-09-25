import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import type { PaxDetails } from "@/lib/types/PaxDetails";
import type { CheckoutTripFromApi } from "@/types/Checkout";
import {
  getCheckoutLevel,
  getCheckoutPaxDetails,
} from "@/lib/helpers/checkout-party";
import CheckoutPage from "../page";

interface Details {
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
interface Contact {
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
  useParams: () => ({ locale: "en" }),
  useRouter: () => ({ replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams("tripId=trip"),
}));
vi.mock("next-auth/react", () => ({ useSession: () => session }));
vi.mock("@/store/slices/userStore", () => ({
  useUserStore: () => ({ isAuthed: true }),
}));
vi.mock("@/lib/i18n/dictionaries", () => ({ getDictionary: async () => en }));
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
  });
  const mount = async () => {
    await act(async () => root.render(<CheckoutPage />));
  };

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
