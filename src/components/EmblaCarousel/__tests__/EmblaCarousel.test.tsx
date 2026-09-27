import useEmblaCarousel from "embla-carousel-react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import EmblaCarousel from "../EmblaCarousel";
import {
  createDomHarness,
  type DomHarness,
} from "../../ui/__tests__/test-dom-utils";

vi.mock("embla-carousel-react", () => ({ default: vi.fn() }));

let harness: DomHarness;
const viewportRef = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useEmblaCarousel).mockReturnValue([viewportRef, undefined]);
  harness = createDomHarness();
});

afterEach(() => harness.unmount());

it.each([
  { overflow: "left", viewportClass: "pr-4" },
  { overflow: "right", viewportClass: "pl-4" },
  { overflow: "both", viewportClass: "rt-container" },
  { overflow: undefined, viewportClass: "overflow-hidden" },
] as const)(
  "renders $overflow overflow without edge fades while preserving the scrolling viewport",
  ({ overflow, viewportClass }) => {
    const carousel = (
      <EmblaCarousel overflow={overflow}>
        {[1, 2, 3, 4].map((index) => (
          <article key={index}>Slide {index}</article>
        ))}
      </EmblaCarousel>
    );
    harness.render(carousel);

    // happy-dom omits mask styles from DOM attributes; SSR preserves both CSS forms.
    expect(renderToString(carousel)).not.toContain("mask-image");
    expect(harness.container.querySelectorAll("article")).toHaveLength(4);
    expect(
      harness.container
        .querySelector('[data-component="EmblaCarousel"]')
        ?.classList.contains("overflow-x-clip"),
    ).toBe(true);
    const viewport = viewportRef.mock.lastCall?.[0] as HTMLDivElement;
    expect(viewport).toBeInstanceOf(HTMLDivElement);
    expect(viewport.classList.contains(viewportClass)).toBe(true);
    expect(viewport.classList.contains("overflow-visible")).toBe(
      overflow !== undefined,
    );
  },
);

it("can bleed right without exposing previous slides to the left", () => {
  harness.render(
    <EmblaCarousel bleedRight overflow="right">
      {[1, 2, 3, 4].map((index) => (
        <article key={index}>Slide {index}</article>
      ))}
    </EmblaCarousel>,
  );
  const carousel = harness.container.querySelector(
    '[data-component="EmblaCarousel"]',
  );

  expect(carousel?.classList.contains("overflow-x-clip")).toBe(false);
  expect(carousel?.classList.contains("overflow-visible")).toBe(true);
  expect(
    carousel?.classList.contains("[clip-path:inset(-100vh_-100vw_-100vh_0)]"),
  ).toBe(true);
});
