/**
 * TripScratchReveal — scratch-to-reveal gate
 *
 * The project does not have @testing-library/react; components are mounted
 * manually via `createRoot` (same pattern as TripItineraryReference.test.tsx).
 *
 * Scenarios covered:
 *   (a) localStorage key already set → renders revealed, no canvas mounted
 *   (b) key absent → canvas mounted, onComplete not yet called
 *   (c) completing the scratch → localStorage key written, onComplete({instant:false})
 */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TripScratchReveal } from "@/components/app/dashboard/traveler/TripScratchReveal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const TRIP_ID = "trip-123";
const STORAGE_KEY = `rt:scratch:${TRIP_ID}`;

const copy = { title: "Scratch to reveal", subtitle: "Drag your finger", scrollCue: "Keep scrolling" };

// Node 25's native (unflagged) `localStorage` global shadows happy-dom's
// implementation and is non-functional without `--localstorage-file`
// (`setItem`/`clear` throw). Stub a real in-memory implementation per test
// file rather than touching the shared vitest config (see GateAwareChrome.test.tsx).
function makeLocalStorageStub() {
  let store = new Map<string, string>();
  return {
    clear: () => {
      store = new Map();
    },
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

let container: HTMLDivElement;
let root: Root;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeFakeCanvasContext(clearedAlpha: number): any {
  return {
    setTransform: vi.fn(),
    createLinearGradient: () => ({ addColorStop: vi.fn() }),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    getImageData: () => ({ data: new Uint8ClampedArray(4 * 100).fill(clearedAlpha) }),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    lineCap: "round",
    lineJoin: "round",
    globalCompositeOperation: "source-over",
  };
}

function render(onComplete?: (r: { instant: boolean }) => void) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <TripScratchReveal copy={copy} onComplete={onComplete} tripId={TRIP_ID}>
        <div data-testid="hero-content">Destination content</div>
      </TripScratchReveal>,
    );
  });
}

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: makeLocalStorageStub(),
  });
  // happy-dom defines setPointerCapture but throws "not implemented" — stub
  // it unconditionally rather than only when the property is entirely absent.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Element.prototype as any).setPointerCapture = vi.fn();
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  vi.useRealTimers();
});

describe("TripScratchReveal — persistence gate", () => {
  it("renders revealed with no canvas when the trip was already scratched", () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    const onComplete = vi.fn();

    render(onComplete);

    expect(container.querySelector("canvas")).toBeNull();
    expect(onComplete).toHaveBeenCalledWith({ instant: true });
  });

  it("mounts the canvas cover when the trip has not been scratched", () => {
    const onComplete = vi.fn();

    render(onComplete);

    expect(container.querySelector("canvas")).not.toBeNull();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("writes the localStorage key and calls onComplete after a completed scratch", () => {
    vi.useFakeTimers();
    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      // A fully-cleared sample immediately crosses the 0.55 completion threshold.
      .mockReturnValue(makeFakeCanvasContext(0));
    const onComplete = vi.fn();

    render(onComplete);

    const cover = container.querySelector("canvas")!.parentElement!;
    act(() => {
      cover.dispatchEvent(
        new PointerEvent("pointerdown", { clientX: 10, clientY: 10, pointerId: 1, bubbles: true }),
      );
      window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
    });

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("1");
    expect(onComplete).not.toHaveBeenCalled(); // still fading out

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(onComplete).toHaveBeenCalledWith({ instant: false });

    getContextSpy.mockRestore();
  });
});
