import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TravelerTypesCarousel } from "../TravelerTypesCarousel";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
}));

let container: HTMLDivElement;
let root: Root;

function render(ui: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(ui);
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  vi.restoreAllMocks();
});

/**
 * Regression coverage for the design ADR-8 wiring inside
 * `TravelerTypesCarousel` itself (not just the pure helpers it calls) —
 * closes the gap flagged as a risk after the initial PR3 apply batch: the
 * carousel's early `return null` guard was removed and its href/fallback
 * logic was never mounted end-to-end. `slidesPerView` defaults to 4 and
 * these fixtures render <= 4 cards, so `EmblaCarousel` never attaches its
 * ref (`isStatic` branch) — Embla's own scroll-measurement code never runs
 * in this test, only the plain-DOM fallback layout, which keeps this test
 * fast and independent of ResizeObserver-driven behavior.
 *
 * Nothing is ever dropped from the carousel: a type the tripper doesn't
 * offer stays visible, loses the tripper badge, gets a "RANDOMTRIP" label
 * instead, and links into that type's base-priced RandomTrip flow via
 * `?catalog=randomtrip` — a dedicated single "browse everything" fallback
 * card was tried and reverted (it read as a second, competing escape hatch
 * next to the attribution banner's own toggle).
 */
describe("TravelerTypesCarousel (design ADR-8 — flag, never drop)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("tripper context: an offered type keeps a working, tripper-attributed href and its badge", () => {
    render(
      <TravelerTypesCarousel
        availableTypes={["couple"]}
        tripperBadge={{ name: "Maria", avatarUrl: null }}
        tripperMode
        tripperSlug="maria"
      />,
    );

    const coupleLink = container.querySelector(
      'a[href="/experiences/by-type/couple?tripper=maria"]',
    );
    expect(coupleLink).not.toBeNull();
    expect(coupleLink?.textContent).toContain("BY TRIPPER");
  });

  it("tripper context: a non-offered type still renders with a catalog=randomtrip href, no tripper badge, RANDOMTRIP label instead", () => {
    render(
      <TravelerTypesCarousel
        availableTypes={["couple"]}
        tripperBadge={{ name: "Maria", avatarUrl: null }}
        tripperMode
        tripperSlug="maria"
      />,
    );

    const soloLink = container.querySelector(
      'a[href="/experiences/by-type/solo?catalog=randomtrip"]',
    );
    expect(soloLink).not.toBeNull();
    expect(soloLink?.textContent).not.toContain("BY TRIPPER");
    expect(soloLink?.textContent).toContain("RANDOMTRIP");
  });

  it("tripper context with an empty availableTypes list: every card still renders, none with a tripper badge", () => {
    render(<TravelerTypesCarousel availableTypes={[]} tripperMode />);

    expect(
      container.querySelector('a[href="/experiences/by-type/couple?catalog=randomtrip"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('a[href="/experiences/by-type/solo?catalog=randomtrip"]'),
    ).not.toBeNull();
  });

  it("non-tripper context: plain hrefs, no catalog fallback, no RANDOMTRIP label, regardless of availableTypes", () => {
    render(<TravelerTypesCarousel />);

    const coupleLink = container.querySelector(
      'a[href="/experiences/by-type/couple"]',
    );
    expect(coupleLink).not.toBeNull();
    expect(coupleLink?.textContent).not.toContain("RANDOMTRIP");
    expect(
      container.querySelector('a[href*="catalog=randomtrip"]'),
    ).toBeNull();
  });

  it("coming-soon types never get an href, in or out of tripper context", () => {
    render(<TravelerTypesCarousel availableTypes={["couple"]} tripperMode />);

    // "family" is in COMING_SOON_SLUGS — coming-soon short-circuits before
    // the availability check, so it must never carry a catalog=randomtrip
    // (or any other) href even though it's not in availableTypes either.
    expect(
      container.querySelector('a[href*="/experiences/by-type/family"]'),
    ).toBeNull();
  });
});
