import { act, lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
vi.mock("next/dynamic", () => ({
  default: (load: () => Promise<ComponentType>) =>
    lazy(async () => ({ default: await load() })),
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "trip", locale: "en" }),
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "buyer" } } }),
}));
vi.mock("@/components/auth/SecureRoute", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/lib/i18n/dictionaries", () => ({ getDictionary: async () => en }));
import Page from "../page";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
it("shows the booked calendar dates consistently with the hero in UTC-3", async () => {
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
          travelers: [],
          cap: 0,
          submitted: 0,
          locked: false,
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
  } finally {
    act(() => root.unmount());
    vi.unstubAllGlobals();
  }
});
