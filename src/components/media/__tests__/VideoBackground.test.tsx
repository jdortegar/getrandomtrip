import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VideoBackground from "@/components/media/VideoBackground";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

vi.mock("next/image", () => ({
  default: ({ src }: { src?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" src={src} />
  ),
}));

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;
let callbacks: ObserverCallback[] = [];

const play = vi.fn(() => Promise.resolve());
const pause = vi.fn();
const load = vi.fn();

function intersect(isIntersecting: boolean) {
  act(() => callbacks.at(-1)?.([{ isIntersecting }]));
}

describe("VideoBackground lazy loading", () => {
  let container: HTMLDivElement;
  let root: Root;

  const video = () => container.querySelector("video") as HTMLVideoElement;

  beforeEach(() => {
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
  });

  afterEach(() => {
    act(() => root.unmount());
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, "connection");
  });

  const mount = () =>
    act(() =>
      root.render(
        <VideoBackground fallbackImage="/images/v.jpg" videoSrc="/v.mp4" />,
      ),
    );

  it("server-renders the video without any src or source", () => {
    const markup = renderToStaticMarkup(
      <VideoBackground fallbackImage="/images/v.jpg" videoSrc="/v.mp4" />,
    );
    const doc = document.createElement("template");
    doc.innerHTML = markup;
    const el = doc.content.querySelector("video");
    expect(el).not.toBeNull();
    expect(el?.hasAttribute("src")).toBe(false);
    expect(doc.content.querySelector("source")).toBeNull();
    expect(el?.getAttribute("preload")).toBe("none");
  });

  it("attaches only the mp4 source and plays once the section is near", () => {
    mount();
    expect(video().querySelector("source")).toBeNull();
    expect(video().getAttribute("preload")).toBe("none");

    intersect(true);
    // Most hero videos ship without a .webm; guessing one costs a 404 per video.
    const sources = [...video().querySelectorAll("source")];
    expect(sources.map((s) => [s.getAttribute("src"), s.type])).toEqual([
      ["/v.mp4", "video/mp4"],
    ]);
    expect(video().hasAttribute("src")).toBe(false);
    expect(load).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalled();
  });

  it("pauses when scrolled away, resumes when back, and keeps the sources", () => {
    mount();
    intersect(true);
    intersect(false);
    expect(pause).toHaveBeenCalled();
    expect(video().querySelectorAll("source")).toHaveLength(1);

    play.mockClear();
    intersect(true);
    expect(play).toHaveBeenCalled();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("stays hidden until playing, then reveals instantly and stays revealed", () => {
    mount();
    expect(video().className).toContain("opacity-0");
    intersect(true);
    act(() => {
      video().dispatchEvent(new Event("canplay"));
    });
    expect(video().className).toContain("opacity-0");
    act(() => {
      video().dispatchEvent(new Event("playing"));
    });
    expect(video().className).toContain("opacity-100");
    expect(video().className).not.toMatch(/duration-/);
    intersect(false);
    expect(pause).toHaveBeenCalled();
    expect(video().className).toContain("opacity-100");
  });

  it("rewinds to frame 0 before the first play", () => {
    mount();
    video().currentTime = 2;
    intersect(true);
    expect(video().currentTime).toBe(0);
  });

  it("stays hidden when playing never fires", () => {
    vi.useFakeTimers();
    try {
      mount();
      intersect(true);
      act(() => vi.advanceTimersByTime(5000));
      expect(video().className).toContain("opacity-0");
    } finally {
      vi.useRealTimers();
    }
  });

  it("never attaches sources on a data-saver connection", () => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: true },
    });
    mount();
    expect(callbacks).toHaveLength(0);
    expect(video().querySelector("source")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/images/v.jpg",
    );
  });
});
