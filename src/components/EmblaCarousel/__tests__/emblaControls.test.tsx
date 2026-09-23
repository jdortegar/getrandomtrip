import { act, StrictMode, useLayoutEffect } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import type { EmblaCarouselType, EmblaEventType } from "embla-carousel";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  NextButton,
  PrevButton,
  usePrevNextButtons,
} from "../EmblaCarouselArrowButtons";
import { DotButton, useDotButton } from "../EmblaCarouselDotButton";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

type Listener = Parameters<EmblaCarouselType["on"]>[1];
function source(selected = 0, snaps = [0, 0.5, 1]) {
  let state = {
    selected,
    snaps,
    prev: selected > 0,
    next: selected < snaps.length - 1,
  };
  const listeners = new Map<EmblaEventType, Listener[]>();
  // Match Embla: on/off return a chain; reInit does not clear listeners.
  const api = {
    canScrollPrev: () => state.prev,
    canScrollNext: () => state.next,
    selectedScrollSnap: () => state.selected,
    scrollSnapList: () => state.snaps,
    scrollPrev: vi.fn(),
    scrollNext: vi.fn(),
    scrollTo: vi.fn(),
    on(event: EmblaEventType, callback: Listener) {
      listeners.set(event, [...(listeners.get(event) ?? []), callback]);
      return api;
    },
    off(event: EmblaEventType, callback: Listener) {
      listeners.set(
        event,
        (listeners.get(event) ?? []).filter((entry) => entry !== callback),
      );
      return api;
    },
  } as unknown as EmblaCarouselType;
  return {
    api,
    listenerCount: () => [...listeners.values()].flat().length,
    change(patch: Partial<typeof state>, event: EmblaEventType = "select") {
      state = { ...state, ...patch };
      for (const callback of listeners.get(event) ?? []) callback(api, event);
    },
  };
}

function Controls({
  api,
  onCommit,
}: {
  api?: EmblaCarouselType;
  onCommit?: (value: string) => void;
}) {
  const arrows = usePrevNextButtons(api);
  const dots = useDotButton(api);
  const snapshot = JSON.stringify([
    arrows.prevBtnDisabled,
    arrows.nextBtnDisabled,
    dots.selectedIndex,
    dots.scrollSnaps,
  ]);
  useLayoutEffect(() => {
    onCommit?.(snapshot);
  }, [onCommit, snapshot]);
  return (
    <>
      <PrevButton
        disabled={arrows.prevBtnDisabled}
        onClick={arrows.onPrevButtonClick}
      />
      <NextButton
        disabled={arrows.nextBtnDisabled}
        onClick={arrows.onNextButtonClick}
      />
      {dots.scrollSnaps.map((_, index) => (
        <DotButton
          index={index}
          key={index}
          onClick={() => dots.onDotButtonClick(index)}
          selected={index === dots.selectedIndex}
        />
      ))}
      <output>{snapshot}</output>
    </>
  );
}
let container: HTMLDivElement;
let root: Root;
function render(api?: EmblaCarouselType, onCommit?: (value: string) => void) {
  act(() => root.render(<Controls api={api} onCommit={onCommit} />));
}
function button(label: string) {
  return container.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
}
function snapshot() {
  return container.querySelector("output")!.textContent;
}
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

it("starts with disabled arrows and no dots before the API arrives", () => {
  render();
  expect(snapshot()).toBe("[true,true,0,[]]");
  expect(button("Previous slide").disabled).toBe(true);
  expect(button("Next slide").disabled).toBe(true);
  expect(container.querySelectorAll("[aria-current]")).toHaveLength(0);
});
it("reads initial state and tracks select and reInit for visible controls", () => {
  const current = source();
  render(current.api);
  expect(snapshot()).toBe("[true,false,0,[0,0.5,1]]");
  expect(button("Go to slide 1").getAttribute("aria-current")).toBe("true");
  act(() => current.change({ selected: 2, prev: true, next: false }));
  expect(snapshot()).toBe("[false,true,2,[0,0.5,1]]");
  expect(button("Go to slide 3").getAttribute("aria-current")).toBe("true");
  act(() =>
    current.change({ selected: 1, snaps: [0, 1], next: true }, "reInit"),
  );
  expect(snapshot()).toBe("[false,false,1,[0,1]]");
  expect(container.querySelectorAll("[aria-current]")).toHaveLength(2);
  act(() => current.change({ selected: 0, prev: false }));
  expect(snapshot()).toBe("[true,false,0,[0,1]]");
});
it("forwards previous, next and dot actions to the current API", () => {
  const first = source(1);
  const second = source(1);
  render(first.api);
  act(() => button("Previous slide").click());
  expect(first.api.scrollPrev).toHaveBeenCalledWith();
  render(second.api);
  act(() => {
    button("Next slide").click();
    button("Go to slide 3").click();
  });
  expect(second.api.scrollNext).toHaveBeenCalledWith();
  expect(second.api.scrollTo).toHaveBeenCalledWith(2);
  expect(first.api.scrollNext).not.toHaveBeenCalled();
  expect(first.api.scrollTo).not.toHaveBeenCalled();
});

it.each(["select", "reInit"] as const)(
  "ignores old-instance %s and releases all listeners on replacement/unmount",
  (event) => {
    const first = source();
    const second = source(1, [0, 1]);
    render(first.api);
    expect(first.listenerCount()).toBeGreaterThan(0);
    render(second.api);
    act(() => first.change({ selected: 2, next: false, snaps: [0] }, event));
    expect(snapshot()).toBe("[false,true,1,[0,1]]");
    expect(first.listenerCount()).toBe(0);
    expect(second.listenerCount()).toBeGreaterThan(0);
    act(() => root.render(<></>));
    expect(second.listenerCount()).toBe(0);
  },
);

it("reads the current API in the first client commit, without an event", () => {
  const commits: string[] = [];
  render(source(2).api, (value) => commits.push(value));
  expect(commits[0]).toBe("[false,true,2,[0,0.5,1]]");
});

it("handles API arrival, removal and return without retaining old controls", () => {
  const current = source(1, [0, 1]);
  render();
  render(current.api);
  expect(snapshot()).toBe("[false,true,1,[0,1]]");
  const commits: string[] = [];
  render(undefined, (value) => commits.push(value));
  expect(commits[0]).toBe("[true,true,0,[]]");
  expect(current.listenerCount()).toBe(0);
  render(current.api);
  expect(snapshot()).toBe("[false,true,1,[0,1]]");
});

it("keeps subscriptions bounded through StrictMode, repeated renders and reInit", () => {
  const current = source();
  render(current.api);
  const count = current.listenerCount();
  expect(count).toBeGreaterThan(0);
  const view = () => (
    <StrictMode>
      <Controls api={current.api} />
    </StrictMode>
  );
  act(() => root.render(view()));
  expect(current.listenerCount()).toBe(count);
  act(() => root.render(view()));
  act(() =>
    current.change(
      { selected: 1, snaps: [0, 1], prev: true, next: false },
      "reInit",
    ),
  );
  act(() => root.render(view()));
  expect(current.listenerCount()).toBe(count);
  expect(snapshot()).toBe("[false,true,1,[0,1]]");
  act(() => root.render(<></>));
  expect(current.listenerCount()).toBe(0);
});

it("hydrates the disabled/empty server snapshot before reading current client state", async () => {
  const current = source(1, [0, 1]);
  const commits: string[] = [];
  const view = (
    <Controls api={current.api} onCommit={(value) => commits.push(value)} />
  );
  act(() => root.unmount());
  container.innerHTML = renderToString(view);
  const output = container.querySelector("output");
  expect(output?.textContent).toBe("[true,true,0,[]]");
  expect(current.listenerCount()).toBe(0);
  const onRecoverableError = vi.fn();
  await act(async () => {
    root = hydrateRoot(container, view, { onRecoverableError });
  });
  expect(onRecoverableError).not.toHaveBeenCalled();
  expect(container.querySelector("output")).toBe(output);
  expect(commits[0]).toBe("[true,true,0,[]]");
  expect(snapshot()).toBe("[false,true,1,[0,1]]");
});
