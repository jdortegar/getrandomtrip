import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HeaderHero from "../HeaderHero";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
it.each([
  ["/videos/hero-video-1.mp4", "video/mp4"],
  ["/videos/custom.webm?version=1", "video/webm"],
])("uses only the supplied video asset %s", (src, type) => {
  // The source only attaches once the hero is near the viewport.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(
        private callback: (entries: Partial<IntersectionObserverEntry>[]) => void,
      ) {}
      observe() {
        this.callback([{ isIntersecting: true }]);
      }
      disconnect() {}
    },
  );
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    act(() => root.render(<HeaderHero title="Journey" videoSrc={src} />));
    const sources = container.querySelectorAll("source");
    expect(sources).toHaveLength(1);
    expect(sources[0].getAttribute("src")).toBe(src);
    expect(sources[0].type).toBe(type);
  } finally {
    act(() => root.unmount());
    vi.unstubAllGlobals();
  }
});

describe("lazy video", () => {
  type ObserverCallback = (
    entries: Partial<IntersectionObserverEntry>[],
  ) => void;
  let callbacks: ObserverCallback[] = [];
  const play = vi.fn(() => Promise.resolve());
  const pause = vi.fn();
  const load = vi.fn();
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  const video = () => container.querySelector("video") as HTMLVideoElement;
  const intersect = (isIntersecting: boolean) =>
    act(() => callbacks.at(-1)?.([{ isIntersecting }]));

  beforeEach(() => {
    vi.useFakeTimers();
    callbacks = [];
    play.mockClear();
    pause.mockClear();
    load.mockClear();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: ObserverCallback) {
          callbacks.push(callback);
        }
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal("matchMedia", () => ({
      addEventListener: () => {},
      matches: false,
      removeEventListener: () => {},
    }));
    Object.defineProperties(HTMLMediaElement.prototype, {
      load: { configurable: true, value: load },
      pause: { configurable: true, value: pause },
      play: { configurable: true, value: play },
    });
    container = document.createElement("div");
    root = createRoot(container);
    act(() =>
      root.render(<HeaderHero title="Journey" videoSrc="/videos/a.mp4" />),
    );
  });

  afterEach(() => {
    act(() => root.unmount());
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, "connection");
  });

  it("server-renders the video without a source and with preload none", () => {
    const template = document.createElement("template");
    template.innerHTML = renderToStaticMarkup(
      <HeaderHero title="Journey" videoSrc="/videos/a.mp4" />,
    );
    expect(template.content.querySelector("source")).toBeNull();
    expect(template.content.querySelector("video")?.hasAttribute("src")).toBe(
      false,
    );
    expect(
      template.content.querySelector("video")?.getAttribute("preload"),
    ).toBe("none");
  });

  it("keeps the video hidden and sourceless until near the viewport, even past the 2s fade fallback", () => {
    act(() => vi.advanceTimersByTime(5000));
    expect(video().querySelector("source")).toBeNull();
    expect(video().className).toContain("opacity-0");
  });

  it("attaches the source near the viewport and fades in on canplay", () => {
    intersect(true);
    expect(video().querySelector("source")?.getAttribute("src")).toBe(
      "/videos/a.mp4",
    );
    expect(load).toHaveBeenCalledTimes(1);
    expect(video().className).toContain("opacity-0");
    act(() => {
      video().dispatchEvent(new Event("canplay"));
    });
    expect(video().className).toContain("opacity-100");
  });

  it("pauses when scrolled away and resumes when back", () => {
    intersect(true);
    intersect(false);
    expect(pause).toHaveBeenCalled();
    expect(video().querySelector("source")).not.toBeNull();
    play.mockClear();
    intersect(true);
    expect(play).toHaveBeenCalled();
  });
});
