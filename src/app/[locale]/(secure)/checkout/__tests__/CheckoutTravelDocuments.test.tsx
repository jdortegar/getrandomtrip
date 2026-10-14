import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import en from "@/dictionaries/en.json";
import type { CheckoutTripFromApi } from "@/types/Checkout";
import type { BuyerDocumentsSnapshot, BuyerTravelDocuments } from "@/types/documents";
import CheckoutPage from "../page";

interface DocumentsCardProps {
  value: BuyerTravelDocuments;
  onChange: (next: BuyerTravelDocuments) => void;
  showErrors: boolean;
  readOnly?: boolean;
}
interface ContactProps {
  onBeforeConfirm: () => Promise<boolean>;
  clientSecret: string | null;
}

const view = vi.hoisted(() => ({
  documents: null as DocumentsCardProps | null,
  contact: null as ContactProps | null,
}));
const toastError = vi.hoisted(() => vi.fn());
// Next provides one stable router instance; a fresh object per render would refetch forever.
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
vi.mock("@/store/slices/userStore", () => ({
  useUserStore: () => ({ isAuthed: true }),
}));
vi.mock("sonner", () => ({ toast: { error: toastError, success: vi.fn() } }));
vi.mock("@/lib/i18n/dictionaries", () => ({
  getDictionary: async (locale: string) => (locale === "en" ? en : es),
}));
vi.mock("@/components/journey/HeaderHero", () => ({ default: () => null }));
vi.mock("@/components/chrome/ChatFab", () => ({ default: () => null }));
vi.mock("@/components/app/checkout/CheckoutTravelDetailsCard", () => ({
  CheckoutTravelDetailsCard: () => null,
}));
vi.mock("@/components/app/checkout/CheckoutTravelDocumentsCard", () => ({
  CheckoutTravelDocumentsCard: (props: DocumentsCardProps) => {
    view.documents = props;
    return null;
  },
}));
vi.mock("@/components/app/checkout/CheckoutContactCard", () => ({
  CheckoutContactCard: (props: ContactProps) => {
    view.contact = props;
    return null;
  },
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const errors = en.journey.checkout.errors;

describe("checkout travel documents", () => {
  let trip: CheckoutTripFromApi & BuyerDocumentsSnapshot;
  let profile: { nationalities: string[]; approvedVisas: string[] };
  let documentsStatus: number;
  let container: HTMLDivElement;
  let root: Root;
  const fetchMock = vi.fn();

  beforeEach(() => {
    trip = {
      id: "trip",
      type: "couple",
      level: "essenza",
      pax: 2,
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
    profile = { nationalities: ["AR"], approvedVisas: ["US"] };
    documentsStatus = 200;
    view.documents = null;
    view.contact = null;
    toastError.mockReset();
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/api/trips") return Response.json({ trips: [trip] });
      if (url === "/api/user/documents") return Response.json({ user: profile });
      if (url === "/api/trips/trip/buyer-documents")
        return Response.json(documentsStatus === 200 ? {} : { error: "Invalid" }, { status: documentsStatus });
      if (url === "/api/user/update") return Response.json({ ok: true });
      if (url === "/api/stripe/payment-intent")
        return Response.json({
          clientSecret: "secret",
          paymentIntentId: "pi_test",
          total: 500,
          discountAmount: 0,
          paxDetails: { adults: 2, minors: 0, rooms: 1 },
          level: "essenza",
          totals: { addonsPerPax: 0, basePerPax: 250, cancelInsurancePerPax: 0, filtersPerPax: 0, totalPerPax: 250, totalTrip: 500 },
        });
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
  const urls = () => fetchMock.mock.calls.map(([url]) => url);
  const confirm = async () => {
    let result = false;
    await act(async () => {
      result = await view.contact!.onBeforeConfirm();
    });
    return result;
  };

  it("prefills from the live profile", async () => {
    await mount();
    expect(view.documents?.value).toEqual({ nationalities: ["AR"], visas: ["US"] });
    expect(view.documents?.showErrors).toBe(false);
  });

  it("prefers the live profile over a stale trip snapshot (linked = live)", async () => {
    trip.buyerNationalities = ["IT"];
    trip.buyerVisas = ["SCHENGEN"];
    await mount();
    expect(urls()).toContain("/api/user/documents");
    expect(view.documents?.value).toEqual({ nationalities: ["AR"], visas: ["US"] });
  });

  it("blocks payment and shows the error when no nationality is selected", async () => {
    profile = { nationalities: [], approvedVisas: [] };
    await mount();
    expect(await confirm()).toBe(false);
    expect(toastError).toHaveBeenCalledWith(errors.nationalitiesRequired);
    expect(view.documents?.showErrors).toBe(true);
    expect(urls()).not.toContain("/api/trips/trip/buyer-documents");
    expect(urls()).not.toContain("/api/user/update");
  });

  it("saves the edited buyer documents before the contact details and confirms", async () => {
    await mount();
    act(() => view.documents!.onChange({ nationalities: ["AR", "IT"], visas: [] }));
    expect(await confirm()).toBe(true);
    const saveIndex = urls().indexOf("/api/trips/trip/buyer-documents");
    expect(saveIndex).toBeGreaterThan(-1);
    expect(saveIndex).toBeLessThan(urls().indexOf("/api/user/update"));
    const [, init] = fetchMock.mock.calls[saveIndex];
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ nationalities: ["AR", "IT"], visas: [] });
  });

  it("blocks payment with a localized toast when the documents save fails", async () => {
    documentsStatus = 400;
    await mount();
    expect(await confirm()).toBe(false);
    expect(toastError).toHaveBeenCalledWith(errors.saveTravelDocumentsFailed);
    expect(urls()).not.toContain("/api/user/update");
  });

  it("keeps the buyer's edits when the profile prefill arrives late", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const base = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url === "/api/user/documents") await gate;
      return base(url, init);
    });
    await mount();
    act(() => view.documents!.onChange({ nationalities: ["UY"], visas: [] }));
    await act(async () => { release(); await gate; });
    expect(view.documents?.value).toEqual({ nationalities: ["UY"], visas: [] });
  });
});
