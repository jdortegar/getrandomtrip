import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ItineraryContent } from "../page";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "trip-1", locale: "en" }),
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

let container: HTMLDivElement;
let root: Root;

function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<ItineraryContent />);
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
      itinerary: [{ title: "Touchdown", description: "Arrival day.", image: null }],
      inclusions: [],
      exclusions: [],
    },
    documents: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
});

describe("Traveler trip-details page — ADR-7 status branching", () => {
  it("renders the pre-reveal card and NOT the hero eyebrow when documents is undefined", async () => {
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

    const text = container.textContent ?? "";
    expect(text).toContain("This trip's itinerary and documents show up once your destination is revealed.");
    expect(text).not.toContain("Your destination, revealed");
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
    expect(text).toContain("Your destination, revealed");
    expect(text).toContain("Mendoza, Argentina");
  });

  it("renders a muted (non-celebratory) hero for a CANCELLED trip, with no departure pill", async () => {
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

    const text = container.textContent ?? "";
    expect(text).toContain("Trip cancelled");
    expect(text).not.toContain("Departs in");
  });
});
