import { act, lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
vi.mock("next/dynamic", () => ({
  default: (load: () => Promise<ComponentType>) =>
    lazy(async () => ({ default: await load() })),
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "trip", locale: "en" }),
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "viewer" } } }),
}));
vi.mock("@/components/auth/SecureRoute", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/lib/i18n/dictionaries", () => ({ getDictionary: async () => en }));
import Page from "../page";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const baseTrip = {
  id: "trip",
  type: "couple",
  level: "essenza",
  status: "CONFIRMED",
  originCity: "Buenos Aires",
  originCountry: "Argentina",
  startDate: "2026-10-09T00:00:00.000Z",
  endDate: "2026-10-11T00:00:00.000Z",
  nights: 2,
  pax: 3,
  transport: "plane",
  climate: "any",
  maxTravelTime: "3h",
  departPref: "any",
  arrivePref: "any",
  avoidDestinations: [],
  addons: [],
  createdAt: "2026-09-27T15:00:00.000Z",
  updatedAt: "2026-09-27T15:00:00.000Z",
};

const row = (over: Record<string, unknown>) => ({
  kind: "ADULT", status: "COMPLETE", fullName: null, email: null, idDocument: null,
  dateOfBirth: null, invitedAt: null, submittedAt: null, joined: false, ...over,
});

const companionTrip = (idDocument: string | null, locked = false) => ({
  ...baseTrip,
  role: "companion",
  roster: {
    viewerRole: "companion",
    cap: 2,
    submitted: 1,
    locked,
    deadline: null,
    startDate: baseTrip.startDate,
    travelers: [
      row({ id: "me", isSelf: true, joined: true, fullName: "Me Myself", email: "me@example.com", idDocument }),
      row({ id: "other", fullName: "Other Person" }),
    ],
  },
});

const buyerTrip = {
  ...baseTrip,
  role: "buyer",
  basePriceUsd: 350,
  payment: { id: "pay", status: "APPROVED", amount: 1050, currency: "USD", provider: "stripe", createdAt: "2026-09-27T15:00:00.000Z" },
  roster: { viewerRole: "buyer", cap: 0, submitted: 0, locked: false, deadline: null, startDate: baseTrip.startDate, travelers: [] },
};

async function mount(trip: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ trip })));
  const container = document.createElement("div");
  const root = createRoot(container);
  await act(async () =>
    root.render(
      <Suspense fallback="Loading">
        <Page />
      </Suspense>,
    ),
  );
  return { container, unmount: () => act(() => root.unmount()) };
}

afterEach(() => vi.unstubAllGlobals());

it("hides price and payment for a companion and lists others by name only (T6)", async () => {
  const { container, unmount } = await mount(companionTrip("PASS-1", true));
  try {
    const text = container.textContent ?? "";
    expect(text).toContain("10/9/2026 → 10/11/2026");
    expect(text).not.toContain(en.tripDetail.costsTitle);
    expect(text).not.toContain(en.tripDetail.paymentInfoTitle);
    expect(text).not.toContain(en.tripDetail.totalTripLabel);
    expect(text).toContain(en.inviteTravelers.companionHeading);
    expect(text).toContain("Other Person");
    expect(container.querySelector("#traveler-other-fullName")).toBeNull();
    // Own details are complete and past the cutoff: nothing is editable, no Save, no invite.
    expect(
      [...container.querySelectorAll("button")].some((b) => b.textContent === en.inviteTravelers.saveAction),
    ).toBe(false);
    expect(container.querySelector('button[aria-label="Resend invite"]')).toBeNull();
  } finally {
    unmount();
  }
});

it("offers Save to a companion whose own details are incomplete, even after the cutoff", async () => {
  const { container, unmount } = await mount(companionTrip(null, true));
  try {
    expect(
      [...container.querySelectorAll("button")].some((b) => b.textContent === en.inviteTravelers.saveAction),
    ).toBe(true);
    expect(container.querySelector<HTMLInputElement>("#traveler-me-idDocument")!.disabled).toBe(false);
  } finally {
    unmount();
  }
});

it("still shows the buyer the cost summary and payment info", async () => {
  const { container, unmount } = await mount(buyerTrip);
  try {
    const text = container.textContent ?? "";
    expect(text).toContain(en.tripDetail.costsTitle);
    expect(text).toContain(en.tripDetail.paymentInfoTitle);
  } finally {
    unmount();
  }
});
