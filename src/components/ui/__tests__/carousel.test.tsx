import {
  act,
  StrictMode,
  useLayoutEffect,
  useRef,
  type ComponentProps,
} from "react";
import { renderToString } from "react-dom/server";
import type { EmblaCarouselType, EmblaEventType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../carousel";
import { createDomHarness, type DomHarness } from "./test-dom-utils";

vi.mock("embla-carousel-react", () => ({ default: vi.fn() }));
type Listener = Parameters<EmblaCarouselType["on"]>[1];
function source(prev = false, next = true) {
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
    canScrollPrev: () => prev,
    canScrollNext: () => next,
    scrollPrev: vi.fn(),
    scrollNext: vi.fn(),
  } as unknown as EmblaCarouselType;
  return {
    api,
    listenerCount: () => [...listeners.values()].flat().length,
    change(
      previous: boolean,
      following: boolean,
      event: EmblaEventType = "select",
    ) {
      prev = previous;
      next = following;
      for (const callback of listeners.get(event) ?? []) callback(api, event);
    },
  };
}
function Example({
  onCommit,
  ...props
}: ComponentProps<typeof Carousel> & {
  onCommit?: (disabled: boolean[]) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    onCommit?.(
      [...root.current!.querySelectorAll("button")].map(
        (button) => button.disabled,
      ),
    );
  }, [onCommit]);
  return (
    <Carousel ref={root} {...props}>
      <CarouselContent>
        <CarouselItem>Trip ideas</CarouselItem>
      </CarouselContent>
      <CarouselPrevious title="Previous choice" type="button" />
      <CarouselNext title="Next choice" type="button" />
    </Carousel>
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
function button(direction: "Previous" | "Next") {
  return harness.container.querySelector<HTMLButtonElement>(
    `[aria-label="${direction} slide"]`,
  )!;
}
function disabled() {
  return [button("Previous").disabled, button("Next").disabled];
}
beforeEach(() => {
  vi.clearAllMocks();
  harness = createDomHarness();
});
afterEach(() => harness.unmount());

it("renders disabled controls without an API, then follows selection and reInit", () => {
  render();
  expect(disabled()).toEqual([true, true]);
  const current = source();
  render(current.api);
  expect(disabled()).toEqual([true, false]);
  act(() => current.change(true, false));
  expect(disabled()).toEqual([false, true]);
  act(() => current.change(false, true, "reInit"));
  expect(disabled()).toEqual([true, false]);
  expect(button("Next").title).toBe("Next choice");
  expect(
    harness.container.querySelector('[aria-roledescription="slide"]')
      ?.textContent,
  ).toBe("Trip ideas");
});
it("preserves button and keyboard actions through the actual context", () => {
  const current = source(true, true);
  render(current.api);
  harness.click(button("Previous"));
  harness.click(button("Next"));
  expect(current.api.scrollPrev).toHaveBeenCalledWith();
  expect(current.api.scrollNext).toHaveBeenCalledWith();
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
it.each([
  ["horizontal", "x"],
  ["vertical", "y"],
] as const)(
  "forwards %s options/plugins, viewport and live setApi",
  (orientation, axis) => {
    const current = source();
    const setApi = vi.fn();
    const plugins = [{ name: "custom", options: {}, init() {}, destroy() {} }];
    render(current.api, { orientation, opts: { loop: true }, plugins, setApi });
    expect(vi.mocked(useEmblaCarousel).mock.lastCall?.[0]).toEqual({
      loop: true,
      axis,
    });
    expect(vi.mocked(useEmblaCarousel).mock.lastCall?.[1]).toBe(plugins);
    expect(viewport.mock.lastCall?.[0]).toBeInstanceOf(HTMLElement);
    expect(setApi).toHaveBeenLastCalledWith(current.api);
    setApi.mockClear();
    render(undefined, { setApi });
    expect(setApi).not.toHaveBeenCalled();
  },
);

it("ignores reInit from a replaced API and detaches both events", () => {
  const first = source(true, false);
  const second = source(false, true);
  render(first.api);
  render(second.api);
  act(() => first.change(true, false, "reInit"));
  expect(disabled()).toEqual([true, false]);
  expect(first.listenerCount()).toBe(0);
  harness.click(button("Next"));
  expect(second.api.scrollNext).toHaveBeenCalledWith();
  expect(first.api.scrollNext).not.toHaveBeenCalled();
  harness.render(<></>);
  expect(second.listenerCount()).toBe(0);
});
it("commits current enabled controls before any selection event", () => {
  const commits: boolean[][] = [];
  render(source(true, true).api, { onCommit: (value) => commits.push(value) });
  expect(commits[0]).toEqual([false, false]);
});

it("disables a removed API immediately and reads it afresh on return", () => {
  const current = source(true, true);
  render(current.api);
  expect(disabled()).toEqual([false, false]);
  const commits: boolean[][] = [];
  render(undefined, { onCommit: (value) => commits.push(value) });
  expect(commits[0]).toEqual([true, true]);
  expect(current.listenerCount()).toBe(0);
  act(() => current.change(false, true, "reInit"));
  render(current.api);
  expect(disabled()).toEqual([true, false]);
});
it("balances listeners across StrictMode replay and releases them on unmount", () => {
  const current = source();
  render(current.api);
  const count = current.listenerCount();
  expect(count).toBeGreaterThan(0);
  const view = () => (
    <StrictMode>
      <Example />
    </StrictMode>
  );
  harness.render(view());
  expect(current.listenerCount()).toBe(count);
  act(() => current.change(true, false, "reInit"));
  expect(disabled()).toEqual([false, true]);
  harness.render(view());
  expect(current.listenerCount()).toBe(count);
  harness.render(<></>);
  expect(current.listenerCount()).toBe(0);
});
it("renders disabled server controls without subscribing to the live API", () => {
  const current = source(true, true);
  vi.mocked(useEmblaCarousel).mockReturnValue([viewport, current.api]);
  const output = document.createElement("div");
  output.innerHTML = renderToString(<Example />);
  expect(
    [...output.querySelectorAll("button")].map((node) => node.disabled),
  ).toEqual([true, true]);
  expect(current.listenerCount()).toBe(0);
});
