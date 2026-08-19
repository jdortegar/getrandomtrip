import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TRIPPER_TRAVELER_TYPES_ANCHOR_ID,
  TripperTravelerTypesSection,
} from "../TripperTravelerTypesSection";

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
 * Regression coverage (risk flagged after the initial PR3 apply batch):
 * this section previously had its own `if (!availableTypes?.length) return
 * null` guard, separate from the one removed from `TravelerTypesCarousel`
 * itself — a tripper with zero ACTIVE experiences would still hide the
 * whole section (including any fallback cards) at this outer layer. Fixed
 * by removing the guard here too, so the section always renders and the
 * carousel underneath shows a full row of `catalog=randomtrip` fallback
 * cards instead of nothing.
 */
describe("TripperTravelerTypesSection (spec 'Carousel Attribution-Aware Fallback Cards')", () => {
  it("renders the section even when the tripper has zero available types (no early-return hide)", () => {
    render(
      <TripperTravelerTypesSection
        availableTypes={[]}
        tripperName="Maria"
        tripperSlug="maria"
      />,
    );

    expect(
      container.querySelector(`#${TRIPPER_TRAVELER_TYPES_ANCHOR_ID}`),
    ).not.toBeNull();
    // The carousel underneath still renders a full row of fallback cards
    // rather than nothing — every card links to the base RandomTrip catalog.
    expect(
      container.querySelector('a[href="/experiences/by-type/couple?catalog=randomtrip"]'),
    ).not.toBeNull();
  });

  it("renders offered-type cards with a working tripper-attributed href", () => {
    render(
      <TripperTravelerTypesSection
        availableTypes={["couple"]}
        tripperName="Maria"
        tripperSlug="maria"
      />,
    );

    expect(
      container.querySelector('a[href="/experiences/by-type/couple?tripper=maria"]'),
    ).not.toBeNull();
  });
});
