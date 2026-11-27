import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TripItineraryContent } from "../TripItineraryContent";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const mockReplace = vi.fn();
const mockRouter = { replace: mockReplace };
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "trip-1", locale: "en" }),
  useRouter: () => mockRouter,
}));

// A STABLE object reference matters: next-auth's real useSession only
// returns a new `session` object when auth state actually changes. A naive
// mock that builds a fresh literal on every call breaks the effect's
// `[session, tripId]` dependency array — the effect re-fires every render,
// triggering a synchronous re-fetch/re-render microtask loop that starves
// the event loop before real timers ever get a turn.
const mockSession = {
  data: { user: { id: "user-1", email: "traveler@example.com", name: "Ana" } },
};
vi.mock("next-auth/react", () => ({
  useSession: () => mockSession,
}));

async function flush() {
  // The dynamic `import()` inside getDictionary() and the mocked fetch chain
  // both need a few real event-loop turns, not just microtask ticks.
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }
}

// The test environment has no localStorage; give each test a fresh in-memory one.
function installMemoryStorage() {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
  return storage;
}

let container: HTMLDivElement;
let root: Root;

function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<TripItineraryContent />);
  });
}

function baseTrip(overrides: Record<string, unknown> = {}) {
  return {
    id: "trip-1",
    status: "REVEALED",
    startDate: "2026-08-22T00:00:00.000Z",
    endDate: "2026-08-24T00:00:00.000Z",
    nights: 2,
    pax: 2,
    actualDestination: "Mendoza, Argentina",
    destinationRevealedAt: "2026-08-20T00:00:00.000Z",
    experience: {
      id: "exp-1",
      title: "Wine Country Escape",
      heroImage: null,
      destinationCity: "Mendoza",
      destinationCountry: "Argentina",
      itinerary: [
        { title: "Touchdown", description: "Arrival day.", image: null },
      ],
      inclusions: [],
      exclusions: [],
    },
    documents: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  mockReplace.mockReset();
  installMemoryStorage();
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  expect(document.body.classList.contains("rt-reveal-locked")).toBe(false);
});

describe("TripItineraryContent — ADR-7 status branching", () => {
  it("does not lock scrolling while the trip has not loaded", () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    render();
    expect(document.body.classList.contains("rt-reveal-locked")).toBe(false);
  });

  it("sends an unrevealed trip (documents omitted) back to the details page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            trip: baseTrip({ status: "CONFIRMED", documents: undefined }),
          }),
      }),
    );

    render();
    await flush();

    expect(mockReplace).toHaveBeenCalledWith("/en/dashboard/trips/trip-1");
    expect(container.textContent).not.toContain("Your next story");
    expect(document.body.classList.contains("rt-reveal-locked")).toBe(false);
  });

  it("mounts the .root subtree and renders the hero eyebrow for a REVEALED trip", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ trip: baseTrip() }),
      }),
    );

    render();
    await flush();

    const text = container.textContent ?? "";
    expect(text).toContain("Your next story / Argentina");
    expect(text).toContain("Mendoza.");
    expect(text).toContain("Explore my trip");
    expect(document.body.classList.contains("rt-reveal-locked")).toBe(true);
  });

  it("sends a cancelled trip back to the details page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            trip: baseTrip({ status: "CANCELLED", documents: [] }),
          }),
      }),
    );

    render();
    await flush();

    expect(mockReplace).toHaveBeenCalledWith("/en/dashboard/trips/trip-1");
    expect(
      container.querySelector('[data-component="TripBoardReveal"]'),
    ).toBeNull();
  });

  it("sends a trip that fails to load back to the details page", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          json: () => Promise.resolve({ error: "Not found" }),
        }),
    );

    render();
    await flush();

    expect(mockReplace).toHaveBeenCalledWith("/en/dashboard/trips/trip-1");
  });
});

describe("TripItineraryContent — reveal plays once per browser", () => {
  const phase = () =>
    container.querySelector<HTMLElement>('[data-component="TripBoardReveal"]')
      ?.dataset.phase;
  const button = (label: string) =>
    Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes(label),
    );

  it("marks the reveal as seen when the traveler skips it", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          json: () =>
            Promise.resolve({
              trip: baseTrip({
                type: "couple",
                originCity: "Buenos Aires",
                originCountry: "Argentina",
              }),
            }),
        }),
    );

    render();
    await flush();
    expect(phase()).toBe("ready");
    expect(window.localStorage.getItem("rt:reveal-seen:trip-1")).toBeNull();

    act(() => button("Reveal my destination")!.click());
    act(() => button("Skip to destination")!.click());
    await flush();

    expect(window.localStorage.getItem("rt:reveal-seen:trip-1")).not.toBeNull();
  });

  it("opens straight on the destination when the reveal was already seen", async () => {
    window.localStorage.setItem(
      "rt:reveal-seen:trip-1",
      "2026-08-20T00:00:00.000Z",
    );
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          json: () =>
            Promise.resolve({
              trip: baseTrip({
                type: "couple",
                originCity: "Buenos Aires",
                originCountry: "Argentina",
              }),
            }),
        }),
    );

    render();
    await flush();

    expect(phase()).toBe("done");
    expect(button("Reveal my destination")).toBeUndefined();
    expect(button("Relive the reveal")).not.toBeUndefined();
    expect(container.querySelector("main#trip-guide")).not.toBeNull();
    expect(document.body.classList.contains("rt-reveal-locked")).toBe(false);
    // Opening already revealed doesn't steal focus to the hero title.
    expect(document.activeElement?.tagName).not.toBe("H1");

    // Replaying still goes back to the ready screen.
    act(() => button("Relive the reveal")!.click());
    await flush();
    expect(phase()).toBe("ready");
  });
});

describe("TripItineraryContent — relive the reveal", () => {
  const button = (label: string) =>
    Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes(label),
    );
  const phase = () =>
    container.querySelector<HTMLElement>('[data-component="TripBoardReveal"]')
      ?.dataset.phase;

  it("shows the bar after the reveal and sends the traveler back to the ready screen", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            trip: baseTrip({
              type: "couple",
              originCity: "Buenos Aires",
              originCountry: "Argentina",
            }),
          }),
      }),
    );
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    render();
    await flush();
    expect(button("Relive the reveal")).toBeUndefined();
    // The "Destination revealed on …" footer belongs to the revealed page, not the gate.
    expect(container.textContent).not.toContain("Destination revealed on");

    act(() => button("Reveal my destination")!.click());
    act(() => button("Skip to destination")!.click());
    await flush();

    expect(phase()).toBe("done");
    expect(container.textContent).toContain("Destination revealed on");
    expect(container.textContent).toContain(
      "The mystery changes shape. The journey begins.",
    );
    expect(container.querySelector("main")).not.toBeNull();
    expect(document.body.classList.contains("rt-reveal-locked")).toBe(false);
    // The guide intro sits after the trip-details strip; "See my route" lands
    // on the itinerary, and the hero's "Explore my trip" on the trip <main>.
    const main = container.querySelector("main#trip-guide");
    expect(main?.querySelector('[data-component="TripGuide"]')).not.toBeNull();
    const blocks = Array.from(main!.children).map((el) =>
      el.querySelector("[data-component]")?.getAttribute("data-component"),
    );
    expect(blocks.indexOf("TripEssentialsStrip")).toBeLessThan(
      blocks.indexOf("TripGuide"),
    );
    expect(container.querySelector('a[href="#itinerary"]')).not.toBeNull();
    expect(main?.querySelector("#itinerary")).not.toBeNull();

    act(() => button("Relive the reveal")!.click());
    await flush();

    expect(phase()).toBe("ready");
    expect(button("Relive the reveal")).toBeUndefined();
    expect(container.querySelector("main")).toBeNull();
    expect(document.body.classList.contains("rt-reveal-locked")).toBe(true);
    expect(document.activeElement).toBe(button("Reveal my destination"));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
  });
});
