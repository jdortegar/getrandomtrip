import { act, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useShouldLoadVideo } from "@/hooks/useShouldLoadVideo";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let observers: {
  callback: ObserverCallback;
  options?: IntersectionObserverInit;
  disconnect: ReturnType<typeof vi.fn>;
}[] = [];

function Probe() {
  const ref = useRef<HTMLDivElement>(null);
  const { isInView, shouldLoad } = useShouldLoadVideo(ref);
  return (
    <div
      data-in-view={String(isInView)}
      data-load={String(shouldLoad)}
      ref={ref}
    />
  );
}

function stubMatchMedia(reducedMotion: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) => ({
      addEventListener: () => {},
      matches: query.includes("prefers-reduced-motion") && reducedMotion,
      removeEventListener: () => {},
    }),
  );
}

function stubConnection(connection: unknown) {
  Object.defineProperty(navigator, "connection", {
    configurable: true,
    value: connection,
  });
}

function intersect(isIntersecting: boolean) {
  act(() => {
    observers.at(-1)?.callback([{ isIntersecting }]);
  });
}

describe("useShouldLoadVideo", () => {
  let container: HTMLDivElement;
  let root: Root;

  const state = () => {
    const el = container.firstElementChild as HTMLElement;
    return { inView: el.dataset.inView, load: el.dataset.load };
  };

  beforeEach(() => {
    observers = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        disconnect = vi.fn();
        constructor(callback: ObserverCallback, options?: IntersectionObserverInit) {
          observers.push({ callback, options, disconnect: this.disconnect });
        }
        observe() {}
        unobserve() {}
      },
    );
    stubMatchMedia(false);
    stubConnection(undefined);
    container = document.createElement("div");
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, "connection");
  });

  const mount = () => act(() => root.render(<Probe />));

  it("is false on the server render", () => {
    const markup = renderToStaticMarkup(<Probe />);
    expect(markup).toContain('data-load="false"');
    expect(markup).toContain('data-in-view="false"');
  });

  it("stays false until the element is near the viewport, observing with a 200px margin", () => {
    mount();
    expect(state()).toEqual({ inView: "false", load: "false" });
    expect(observers[0].options?.rootMargin).toBe("200px");
    intersect(true);
    expect(state()).toEqual({ inView: "true", load: "true" });
  });

  it("keeps loading after the element scrolls away but reports it out of view", () => {
    mount();
    intersect(true);
    intersect(false);
    expect(state()).toEqual({ inView: "false", load: "true" });
    intersect(true);
    expect(state()).toEqual({ inView: "true", load: "true" });
  });

  it.each([
    ["saveData", { saveData: true, effectiveType: "4g" }],
    ["2g", { effectiveType: "2g" }],
    ["slow-2g", { effectiveType: "slow-2g" }],
  ])("never loads on a restricted connection (%s)", (_name, connection) => {
    stubConnection(connection);
    mount();
    expect(observers).toHaveLength(0);
    expect(state().load).toBe("false");
  });

  it("allows 3g/4g and a missing Connection API", () => {
    stubConnection({ effectiveType: "3g", saveData: false });
    mount();
    intersect(true);
    expect(state().load).toBe("true");
  });

  it("never loads when the user prefers reduced motion", () => {
    stubMatchMedia(true);
    mount();
    expect(observers).toHaveLength(0);
    expect(state().load).toBe("false");
  });

  it("treats a missing IntersectionObserver as in view", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    await act(async () => root.render(<Probe />));
    expect(state()).toEqual({ inView: "true", load: "true" });
  });

  it("disconnects the observer on unmount", () => {
    mount();
    act(() => root.unmount());
    expect(observers[0].disconnect).toHaveBeenCalled();
    root = createRoot(container);
  });
});
