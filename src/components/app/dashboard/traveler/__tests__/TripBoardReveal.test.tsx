/**
 * TripBoardReveal — compass + split-flap reveal gate.
 *
 * Mounted via `createRoot` (the project has no @testing-library/react), same
 * pattern as the other traveler component tests. happy-dom has no Web
 * Animations API, so board tiles snap to their text — which lets these tests
 * read what the board shows.
 */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TripBoardReveal } from "@/components/app/dashboard/traveler/TripBoardReveal";
import {
  BOARD_REVEAL_CONFIG,
  boardSettleMs,
  pickBoardSequence,
} from "@/components/app/dashboard/traveler/boardReveal";
import en from "@/dictionaries/en.json";
import { NavbarChromeContext } from "@/context/NavbarChromeContext";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const TRIP_ID = "trip-123";
const copy = en.tripItinerary.boardReveal;

// Node 25's native `localStorage` global shadows happy-dom's and throws
// without `--localstorage-file`; stub an in-memory one per test.
function makeLocalStorageStub() {
  const store = new Map<string, string>();
  return {
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    removeItem: (key: string) => void store.delete(key),
    setItem: (key: string, value: string) => void store.set(key, value),
  };
}

function mockReducedMotion(matches: boolean) {
  const media = Object.assign(new EventTarget(), {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  });
  vi.spyOn(window, "matchMedia").mockReturnValue(media as unknown as MediaQueryList);
  return media;
}

let container: HTMLDivElement;
let root: Root;

function render(onComplete = vi.fn(), destination = "Mendoza") {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <TripBoardReveal copy={copy} destination={destination} locale="en" onComplete={onComplete} tripId={TRIP_ID}>
        <h1 data-testid="hero-title">Mendoza, Argentina</h1>
      </TripBoardReveal>,
    );
  });
  return onComplete;
}

const wrap = () => container.querySelector<HTMLElement>('[data-component="TripBoardReveal"]')!;
const content = () => container.querySelector('[data-testid="hero-title"]')!.parentElement!;
const ctaButton = () =>
  Array.from(container.querySelectorAll("button")).find((b) => b.textContent?.includes(copy.cta));
const skipButton = () =>
  Array.from(container.querySelectorAll("button")).find((b) => b.textContent?.includes(copy.skip));
const boardText = () =>
  Array.from(container.querySelectorAll("[data-half='staticTop'] [data-glyph]"))
    .map((glyph) => glyph.textContent)
    .join("")
    .trim();

/** Ms from clicking the CTA until the destination word is on the board. */
const destinationAt =
  BOARD_REVEAL_CONFIG.orientMs + pickBoardSequence(TRIP_ID).length * BOARD_REVEAL_CONFIG.wordIntervalMs;
const totalMs =
  destinationAt + boardSettleMs(1) + BOARD_REVEAL_CONFIG.finalHoldMs + BOARD_REVEAL_CONFIG.openingMs;

beforeEach(() => {
  Object.defineProperty(window, "localStorage", { configurable: true, value: makeLocalStorageStub() });
});

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("TripBoardReveal — gate", () => {
  it("shows the ready gate and hides the hero until the traveler reveals", () => {
    const onComplete = render();

    expect(wrap().dataset.phase).toBe("ready");
    expect(ctaButton()).toBeDefined();
    expect(content().getAttribute("aria-hidden")).toBe("true");
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("shows the gate on every visit, even for a trip revealed before", () => {
    window.localStorage.setItem(`rt:reveal:${TRIP_ID}`, "1");
    window.localStorage.setItem(`rt:scratch:${TRIP_ID}`, "1");
    const onComplete = render();

    expect(wrap().dataset.phase).toBe("ready");
    expect(ctaButton()).toBeDefined();
    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("TripBoardReveal — sequence", () => {
  it("plays compass → brand words → destination, then opens the hero", () => {
    vi.useFakeTimers();
    const onComplete = render();

    act(() => ctaButton()!.click());
    expect(wrap().dataset.phase).toBe("orienting");
    expect(skipButton()).toBeDefined();

    act(() => vi.advanceTimersByTime(BOARD_REVEAL_CONFIG.orientMs));
    expect(wrap().dataset.phase).toBe("boarding");
    expect(boardText()).toBe(pickBoardSequence(TRIP_ID)[0]);
    expect(boardText()).not.toBe("MENDOZA");

    act(() => vi.advanceTimersByTime(destinationAt - BOARD_REVEAL_CONFIG.orientMs));
    expect(boardText()).toBe("MENDOZA");
    expect(container.textContent).toContain(copy.boardCaptionFinal);
    expect(onComplete).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(totalMs - destinationAt));
    expect(wrap().dataset.phase).toBe("done");
    expect(onComplete).toHaveBeenCalledWith({ instant: false });
    expect(content().getAttribute("aria-hidden")).toBe("false");
    expect(document.activeElement).toBe(container.querySelector('[data-testid="hero-title"]'));
    expect(container.textContent).toContain("Your destination: Mendoza.");
  });

  it("skip lands on the destination at once and stops the sequence", () => {
    vi.useFakeTimers();
    const onComplete = render();

    act(() => ctaButton()!.click());
    act(() => vi.advanceTimersByTime(BOARD_REVEAL_CONFIG.orientMs + 100));
    act(() => skipButton()!.click());

    expect(wrap().dataset.phase).toBe("done");
    expect(onComplete).toHaveBeenCalledWith({ instant: true });

    act(() => vi.advanceTimersByTime(totalMs));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("with reduced motion, the CTA reveals immediately with no sequence", () => {
    mockReducedMotion(true);
    const onComplete = render();

    expect(wrap().dataset.phase).toBe("ready");
    act(() => ctaButton()!.click());

    expect(wrap().dataset.phase).toBe("done");
    expect(onComplete).toHaveBeenCalledWith({ instant: true });
  });

  it("turning reduced motion on mid-sequence lands on the destination", () => {
    vi.useFakeTimers();
    const media = mockReducedMotion(false);
    const onComplete = render();

    act(() => ctaButton()!.click());
    expect(wrap().dataset.phase).toBe("orienting");

    act(() => {
      media.matches = true;
      media.dispatchEvent(new Event("change"));
    });

    expect(wrap().dataset.phase).toBe("done");
    expect(onComplete).toHaveBeenCalledWith({ instant: true });
  });

  it("wraps a long destination onto more board rows instead of truncating it", () => {
    vi.useFakeTimers();
    render(vi.fn(), "San Carlos de Bariloche");

    act(() => ctaButton()!.click());
    act(() => vi.advanceTimersByTime(destinationAt));

    const tiles = container.querySelectorAll("[data-half='staticTop'] [data-glyph]");
    expect(tiles).toHaveLength(2 * BOARD_REVEAL_CONFIG.columns);
    expect(boardText().replace(/\s+/g, " ")).toBe("SAN CARLOS DE BARILOCHE");
  });
});

describe("TripBoardReveal — navbar chrome", () => {
  it("keeps the navbar solid on the ready screen, hides it while playing, then overlays the hero", () => {
    vi.useFakeTimers();
    const setNavbarOverlay = vi.fn();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(
        <NavbarChromeContext.Provider value={{ setNavbarBackgroundPrimary: vi.fn(), setNavbarOverlay }}>
          <TripBoardReveal copy={copy} destination="Mendoza" locale="en" tripId={TRIP_ID}>
            <h1 data-testid="hero-title">Mendoza.</h1>
          </TripBoardReveal>
        </NavbarChromeContext.Provider>,
      );
    });

    expect(setNavbarOverlay).not.toHaveBeenCalled();
    expect(document.body.classList.contains("rt-reveal-playing")).toBe(false);

    act(() => ctaButton()!.click());
    expect(setNavbarOverlay).toHaveBeenLastCalledWith(true);
    expect(document.body.classList.contains("rt-reveal-playing")).toBe(true);

    act(() => vi.advanceTimersByTime(totalMs));
    expect(wrap().dataset.phase).toBe("done");
    expect(document.body.classList.contains("rt-reveal-playing")).toBe(false);
    expect(document.body.classList.contains("rt-reveal-hero")).toBe(true);
    expect(setNavbarOverlay).toHaveBeenLastCalledWith(true);

    act(() => root.unmount());
    expect(setNavbarOverlay).toHaveBeenLastCalledWith(false);
    expect(document.body.classList.contains("rt-reveal-hero")).toBe(false);
  });
});

it("after a skip, keeps transitions on controls inside the hero (only the reveal's own elements snap)", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const css = fs.readFileSync(
    path.resolve(__dirname, "../traveler-trip-details.module.css"),
    "utf8",
  );
  // A blanket `.revealInstant *` would freeze ButtonV2's hover lift in the hero.
  expect(css).not.toMatch(/\.revealInstant\s+\*/);
  expect(css).toMatch(/\.revealInstant \.destPhoto,\n\.revealInstant \.destContent \{/);
});
