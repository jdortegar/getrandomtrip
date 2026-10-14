import { act, lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterAll, afterEach, beforeAll, expect, it, vi } from "vitest";
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
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import Page from "../page";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const copy = en.tripDetail.buyerDocuments;

const baseTrip = {
  id: "trip",
  type: "couple",
  level: "essenza",
  status: "CONFIRMED",
  originCity: "Buenos Aires",
  originCountry: "Argentina",
  startDate: "2026-12-09T00:00:00.000Z",
  endDate: "2026-12-11T00:00:00.000Z",
  nights: 2,
  pax: 2,
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

const roster = (locked: boolean, viewerRole: "buyer" | "companion" = "buyer") => ({
  viewerRole, cap: 0, submitted: 0, locked, deadline: null, startDate: baseTrip.startDate, travelers: [],
});

const buyerTrip = (over: Record<string, unknown> = {}, locked = false) => ({
  ...baseTrip,
  role: "buyer",
  basePriceUsd: 350,
  payment: { id: "pay", status: "APPROVED", amount: 700, currency: "USD", provider: "stripe", createdAt: "2026-09-27T15:00:00.000Z" },
  buyerNationalities: [],
  buyerVisas: [],
  roster: roster(locked),
  ...over,
});

async function mount(trip: unknown, onPatch?: (init: RequestInit) => Response) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) =>
    init?.method === "PATCH" && onPatch ? onPatch(init) : Response.json({ trip }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const container = document.createElement("div");
  const root = createRoot(container);
  await act(async () =>
    root.render(
      <Suspense fallback="Loading">
        <Page />
      </Suspense>,
    ),
  );
  return { container, fetchMock, unmount: () => act(() => root.unmount()) };
}

const saveButton = (container: HTMLElement) =>
  [...container.querySelectorAll("button")].find((b) => b.textContent === copy.saveAction);

// Pin "now" so the fixture trip (December 2026) stays upcoming; only Date is faked.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-13T12:00:00.000Z"));
});
afterAll(() => vi.useRealTimers());
afterEach(() => vi.unstubAllGlobals());

it("shows a paid buyer with no documents the section and the completion prompt", async () => {
  const { container, unmount } = await mount(buyerTrip());
  try {
    const text = container.textContent ?? "";
    expect(text).toContain(copy.title);
    expect(text).toContain(copy.missingTitle);
    expect(saveButton(container)).toBeDefined();
  } finally {
    unmount();
  }
});

it("prefills the buyer's saved documents and saves through the endpoint", async () => {
  const { container, fetchMock, unmount } = await mount(
    buyerTrip({ buyerNationalities: ["AR"], buyerVisas: ["US"] }),
    () => Response.json({ buyerNationalities: ["AR"], buyerVisas: ["US"] }),
  );
  try {
    expect(container.textContent).not.toContain(copy.missingTitle);
    expect(container.textContent).toContain("Argentina");
    await act(async () => {
      saveButton(container)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    const patch = fetchMock.mock.calls.find(([, init]) => init?.method === "PATCH");
    expect(patch?.[0]).toBe("/api/trips/trip/buyer-documents");
    expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ nationalities: ["AR"], visas: ["US"] });
  } finally {
    unmount();
  }
});

it("keeps the buyer's live documents editable after the roster locks (linked = live)", async () => {
  const { container, unmount } = await mount(
    buyerTrip({ buyerNationalities: ["AR"], buyerVisas: ["US"] }, true),
  );
  try {
    expect(container.textContent).toContain(copy.title);
    expect(saveButton(container)).toBeDefined();
    expect(container.querySelector('[aria-label="Remove Argentina"]')).not.toBeNull();
  } finally {
    unmount();
  }
});

it("still prompts for missing documents after the roster locks", async () => {
  const { container, unmount } = await mount(buyerTrip({}, true));
  try {
    expect(container.textContent).toContain(copy.missingTitle);
    expect(saveButton(container)).toBeDefined();
  } finally {
    unmount();
  }
});

it("renders read-only for a cancelled trip", async () => {
  const { container, unmount } = await mount(buyerTrip({ status: "CANCELLED" }));
  try {
    expect(container.textContent).toContain(copy.title);
    expect(container.textContent).not.toContain(copy.missingTitle);
    expect(saveButton(container)).toBeUndefined();
  } finally {
    unmount();
  }
});

it.each(["CONFIRMED", "REVEALED", "COMPLETED"])(
  "stays editable once a paid %s trip has ended (profile documents)",
  async (status) => {
    const { container, unmount } = await mount(
      buyerTrip({
        status,
        startDate: "2026-09-01T00:00:00.000Z",
        endDate: "2026-09-05T00:00:00.000Z",
      }),
    );
    try {
      expect(container.textContent).toContain(copy.title);
      expect(saveButton(container)).toBeDefined();
    } finally {
      unmount();
    }
  },
);

it("leaves unpaid trips to checkout", async () => {
  const { container, unmount } = await mount(
    buyerTrip({ status: "PENDING_PAYMENT", payment: undefined }),
  );
  try {
    expect(container.textContent).not.toContain(copy.title);
  } finally {
    unmount();
  }
});

it("never shows the buyer's documents section to a companion", async () => {
  const { container, unmount } = await mount({ ...baseTrip, role: "companion", roster: roster(false, "companion") });
  try {
    const text = container.textContent ?? "";
    expect(text).not.toContain(copy.title);
    expect(text).not.toContain(copy.missingTitle);
  } finally {
    unmount();
  }
});
