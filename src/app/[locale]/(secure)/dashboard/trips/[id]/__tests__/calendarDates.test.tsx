import { act, lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
const navigation = vi.hoisted(() => ({ locale: "en" }));
vi.mock("next/dynamic", () => ({
  default: (load: () => Promise<ComponentType>) =>
    lazy(async () => ({ default: await load() })),
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "trip", locale: navigation.locale }),
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "buyer" } } }),
}));
vi.mock("@/components/auth/SecureRoute", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/lib/i18n/dictionaries", () => ({ getDictionary: async (locale: string) => locale === "es" ? es : en }));
import Page from "../page";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
it.each([false, true])("shows dates and allows missing traveler details to save (locked=%s)", async (locked) => {
  const fetchMock = vi.fn().mockResolvedValue(
    Response.json({
      trip: {
        id: "trip",
        type: "couple",
        level: "essenza",
        status: "CONFIRMED",
        originCity: "Buenos Aires",
        originCountry: "Argentina",
        startDate: "2026-10-09T00:00:00.000Z",
        endDate: "2026-10-11T00:00:00.000Z",
        nights: 2,
        pax: 2,
        basePriceUsd: 350,
        transport: "plane",
        climate: "any",
        maxTravelTime: "3h",
        departPref: "any",
        arrivePref: "any",
        avoidDestinations: [],
        addons: [],
        createdAt: "2026-09-27T15:00:00.000Z",
        updatedAt: "2026-09-27T15:00:00.000Z",
        roster: {
          travelers: [{ id: "trav-1", kind: "ADULT", status: "INVITED", fullName: "Alex", email: "alex@example.com", idDocument: null, dateOfBirth: null, invitedAt: null, submittedAt: null }],
          cap: 1,
          submitted: 0,
          locked,
          deadline: null,
          startDate: "2026-10-09T00:00:00.000Z",
        },
      },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    await act(async () =>
      root.render(
        <Suspense fallback="Loading">
          <Page />
        </Suspense>,
      ),
    );
    expect(container.textContent).toContain("10/9/2026 → 10/11/2026");
    expect(container.textContent).not.toContain("10/8/2026");
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/trips/trip");
    const input = container.querySelector<HTMLInputElement>("#traveler-trav-1-idDocument")!;
    expect(input.disabled).toBe(false);
    expect(container.querySelector<HTMLInputElement>("#traveler-trav-1-fullName")!.disabled).toBe(locked);
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "PASSPORT");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const save = [...container.querySelectorAll("button")].find((button) => button.textContent === en.inviteTravelers.saveAction)!;
    expect(save).toBeDefined();
    fetchMock.mockResolvedValueOnce(Response.json({ traveler: { id: "trav-1", kind: "ADULT", status: "COMPLETE", fullName: "Alex", email: "alex@example.com", idDocument: "PASSPORT", dateOfBirth: null } }));
    await act(async () => save.click());
    expect(fetchMock).toHaveBeenLastCalledWith("/api/travelers/trav-1", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ fullName: "Alex", email: "alex@example.com", idDocument: "PASSPORT" }) }));
    expect(input.disabled).toBe(locked);
  } finally {
    act(() => root.unmount());
    vi.unstubAllGlobals();
  }
});

it.each([
  ["en", "plane", "Own car"],
  ["en", "own-car", "Own car"],
  ["es", "plane", "Auto propio"],
  ["es", "own-car", "Auto propio"],
])("shows XSED transport %s/%s without repairing the paid trip", async (locale, transport, expected) => {
  navigation.locale = locale;
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ trip: {
    id: "trip", type: "xsed", level: "family", status: "CONFIRMED",
    originCity: "Buenos Aires", originCountry: "Argentina", pax: 2,
    startDate: "2026-10-03T00:00:00.000Z", endDate: "2026-10-04T00:00:00.000Z",
    createdAt: "2026-09-27T15:00:00.000Z", nights: 1, transport,
    climate: "any", maxTravelTime: "no-limit", departPref: "any", arrivePref: "any",
    avoidDestinations: [], addons: [], basePriceUsd: 250,
  } }));
  vi.stubGlobal("fetch", fetchMock);
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    await act(async () => root.render(<Suspense fallback="Loading"><Page /></Suspense>));
    expect(container.textContent).toContain(expected);
    expect(container.textContent).not.toContain("own-car");
    expect(container.textContent).not.toContain("Avión");
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/trips/trip");
  } finally {
    act(() => root.unmount());
    vi.unstubAllGlobals();
    navigation.locale = "en";
  }
});
