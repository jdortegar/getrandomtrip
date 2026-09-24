import { act, useLayoutEffect, type ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import type { EmblaCarouselType, EmblaEventType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselRoot,
  useCarousel,
} from "../Carousel";
import {
  createDomHarness,
  type DomHarness,
} from "../ui/__tests__/test-dom-utils";

vi.mock("embla-carousel-react", () => ({ default: vi.fn() }));
type Listener = Parameters<EmblaCarouselType["on"]>[1];
function source(selected = 0, snaps = [0, 0.5, 1]) {
  const listeners = new Map<EmblaEventType, Listener[]>();
  const events = {
    on(event: EmblaEventType, callback: Listener) {
      listeners.set(event, [...(listeners.get(event) ?? []), callback]);
      return events;
    },
    off(event: EmblaEventType, callback: Listener) {
      listeners.set(
        event,
        (listeners.get(event) ?? []).filter((entry) => entry !== callback),
      );
      return events;
    },
  };
  const api = {
    ...events,
    canScrollPrev: () => selected > 0,
    canScrollNext: () => selected < snaps.length - 1,
    selectedScrollSnap: () => selected,
    scrollSnapList: () => snaps,
    scrollPrev: vi.fn(),
    scrollNext: vi.fn(),
    scrollTo: vi.fn(),
  } as unknown as EmblaCarouselType;
  return {
    api,
    listenerCount: () => [...listeners.values()].flat().length,
    change(index: number, event: EmblaEventType = "select", nextSnaps = snaps) {
      selected = index;
      snaps = nextSnaps;
      for (const callback of listeners.get(event) ?? []) callback(api, event);
    },
  };
}
function State({ onCommit }: { onCommit?: (value: string) => void }) {
  const { canScrollPrev, canScrollNext, selectedIndex, scrollSnaps } =
    useCarousel();
  const value = JSON.stringify([
    canScrollPrev,
    canScrollNext,
    selectedIndex,
    scrollSnaps,
  ]);
  useLayoutEffect(() => {
    onCommit?.(value);
  }, [onCommit, value]);
  return <output>{value}</output>;
}
function Example({
  onCommit,
  children = "Original slide",
  ...props
}: ComponentProps<typeof CarouselRoot> & {
  onCommit?: (value: string) => void;
}) {
  return (
    <CarouselRoot {...props}>
      <CarouselContent>
        <CarouselItem>{children}</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
      <CarouselDots />
      <State onCommit={onCommit} />
    </CarouselRoot>
  );
}
let harness: DomHarness;
const viewport = vi.fn();
function render(
  api?: EmblaCarouselType,
  props: ComponentProps<typeof Example> = {},
) {
  vi.mocked(useEmblaCarousel).mockReturnValue([viewport, api]);
  harness.render(<Example {...props} />);
}
function snapshot() {
  return harness.container.querySelector("output")!.textContent;
}
function button(label: string) {
  return [
    ...harness.container.querySelectorAll<HTMLButtonElement>("button"),
  ].find(
    (node) => (node.getAttribute("aria-label") ?? node.textContent) === label,
  )!;
}
beforeEach(() => {
  vi.clearAllMocks();
  harness = createDomHarness();
});
afterEach(() => harness.unmount());

it("renders initial boundaries and follows selection/reInit without replacing content", () => {
  const current = source();
  render(current.api);
  const slide = harness.container.querySelector(
    '[aria-roledescription="slide"]',
  );
  expect(slide?.textContent).toBe("Original slide");
  expect(button("Previous slide").disabled).toBe(true);
  expect(button("Next slide").disabled).toBe(false);
  expect(snapshot()).toBe("[false,true,0,[0,0.5,1]]");
  act(() => current.change(2));
  expect(button("Next slide").disabled).toBe(true);
  expect(snapshot()).toBe("[true,false,2,[0,0.5,1]]");
  act(() => current.change(1, "reInit", [0, 1]));
  expect(snapshot()).toBe("[true,false,1,[0,1]]");
  expect(
    harness.container.querySelectorAll('[aria-label^="Go to slide"]'),
  ).toHaveLength(2);
  expect(
    harness.container.querySelector('[aria-roledescription="slide"]'),
  ).toBe(slide);
});
it("routes button, dot and keyboard actions through the current context", () => {
  const current = source(1);
  render(current.api);
  harness.click(button("Previous slide"));
  harness.click(button("Next slide"));
  harness.click(button("Go to slide 3"));
  expect(current.api.scrollPrev).toHaveBeenCalledWith();
  expect(current.api.scrollNext).toHaveBeenCalledWith();
  expect(current.api.scrollTo).toHaveBeenCalledWith(2);
  for (const [key, method] of [
    ["ArrowLeft", current.api.scrollPrev],
    ["ArrowRight", current.api.scrollNext],
  ] as const) {
    vi.mocked(method).mockClear();
    const event = new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
    });
    act(() =>
      harness.container.querySelector('[role="region"]')!.dispatchEvent(event),
    );
    expect(event.defaultPrevented).toBe(true);
    expect(method).toHaveBeenCalledWith();
  }
});
it("already detaches replaced APIs and notifies setApi only for live instances", () => {
  const first = source();
  const second = source(1, [0, 1]);
  const setApi = vi.fn();
  render(first.api, { setApi });
  expect(first.listenerCount()).toBeGreaterThan(0);
  expect(setApi).toHaveBeenLastCalledWith(first.api);
  render(second.api, { setApi });
  expect(setApi).toHaveBeenLastCalledWith(second.api);
  expect(first.listenerCount()).toBe(0);
  act(() => first.change(2, "reInit"));
  expect(snapshot()).toBe("[true,false,1,[0,1]]");
  harness.click(button("Previous slide"));
  expect(second.api.scrollPrev).toHaveBeenCalledWith();
  expect(first.api.scrollPrev).not.toHaveBeenCalled();
  setApi.mockClear();
  render(undefined, { setApi });
  expect(setApi).not.toHaveBeenCalled();
  expect(second.listenerCount()).toBe(0);
});

it("preserves options, wheel/user plugins, viewport ref and changed children", () => {
  const current = source();
  const plugin = {
    name: "custom",
    options: { active: true },
    init() {},
    destroy() {},
  };
  const props = {
    opts: { loop: true, axis: "x" as const },
    orientation: "vertical" as const,
    plugins: [plugin],
  };
  render(current.api, props);
  const [options, plugins] = vi.mocked(useEmblaCarousel).mock.lastCall!;
  expect(options).toEqual({ loop: true, axis: "y" });
  expect(plugins?.map((item) => item.name)).toEqual([
    "wheelGestures",
    "custom",
  ]);
  expect(plugins?.[1]).toBe(plugin);
  expect(viewport.mock.lastCall?.[0]).toBeInstanceOf(HTMLElement);
  render(current.api, { ...props, children: "Updated slide" });
  expect(
    harness.container.querySelector('[aria-roledescription="slide"]')
      ?.textContent,
  ).toBe("Updated slide");
  expect(vi.mocked(useEmblaCarousel).mock.lastCall?.[1]).toBe(plugins);
});

it("keeps preset title, visibility toggles and slidesToScroll forwarding", () => {
  vi.mocked(useEmblaCarousel).mockReturnValue([viewport, source().api]);
  harness.render(
    <Carousel
      showArrows={false}
      showDots={false}
      slidesToScroll={2}
      title="Trip ideas"
    >
      <p>First</p>
      <p>Second</p>
    </Carousel>,
  );
  expect(harness.container.querySelector("h3")?.textContent).toBe("Trip ideas");
  expect(harness.container.querySelectorAll("button")).toHaveLength(0);
  expect(
    harness.container.querySelectorAll('[aria-roledescription="slide"]'),
  ).toHaveLength(2);
  expect(vi.mocked(useEmblaCarousel).mock.lastCall?.[0]).toEqual({
    align: "start",
    loop: false,
    axis: "x",
    slidesToScroll: 2,
  });
});

it.each([
  { index: 0, expected: "[false,true,0,[0,0.5,1]]" },
  { index: 2, expected: "[true,false,2,[0,0.5,1]]" },
])(
  "commits current API state immediately at index $index",
  ({ index, expected }) => {
    const commits: string[] = [];
    render(source(index).api, { onCommit: (value) => commits.push(value) });
    expect(commits[0]).toBe(expected);
  },
);

it("resets missing APIs immediately, then recovers with current controls", () => {
  const current = source(2);
  render();
  expect(snapshot()).toBe("[false,false,0,[]]");
  render(current.api);
  expect(snapshot()).toBe("[true,false,2,[0,0.5,1]]");
  const commits: string[] = [];
  render(undefined, { onCommit: (value) => commits.push(value) });
  expect(commits[0]).toBe("[false,false,0,[]]");
  expect(current.listenerCount()).toBe(0);
  act(() => current.change(0));
  render(current.api);
  expect(snapshot()).toBe("[false,true,0,[0,0.5,1]]");
  harness.render(<></>);
  expect(current.listenerCount()).toBe(0);
});

it("keeps the disabled/empty server snapshot without subscribing", () => {
  const current = source(2);
  vi.mocked(useEmblaCarousel).mockReturnValue([viewport, current.api]);
  const output = document.createElement("div");
  output.innerHTML = renderToString(<Example />);
  expect(output.querySelector("output")?.textContent).toBe(
    "[false,false,0,[]]",
  );
  expect(output.querySelectorAll("button:disabled")).toHaveLength(2);
  expect(output.querySelectorAll('[aria-label^="Go to slide"]')).toHaveLength(
    0,
  );
  expect(current.listenerCount()).toBe(0);
});
