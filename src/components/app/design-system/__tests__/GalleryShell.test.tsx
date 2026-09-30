import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DesignSystemGallery } from "../DesignSystemGallery";
import { NavbarChromeContext } from "@/context/NavbarChromeContext";
import en from "@/dictionaries/en.json";
import type { DesignSystemDict } from "@/lib/types/dictionary";

const scrollTo = vi.hoisted(() => vi.fn());
vi.mock("lenis/react", () => ({ useLenis: () => ({ scrollTo }) }));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement;
let root: Root;
let frames: FrameRequestCallback[];
const copy = en.designSystem as DesignSystemDict;
const solid = vi.fn();

beforeEach(() => {
  frames = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  solid.mockClear();
  scrollTo.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  expect(solid).toHaveBeenLastCalledWith(false);
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("uses six numbered anchor sections and safely reveals scrollspy without changing focus or hash", () => {
  act(() =>
    root.render(
      <NavbarChromeContext.Provider
        value={{ setNavbarBackgroundPrimary: solid }}
      >
        <DesignSystemGallery copy={copy} />
      </NavbarChromeContext.Provider>,
    ),
  );
  expect(solid).toHaveBeenCalledWith(true);
  expect(container.querySelector("main")).toBeNull();
  expect(
    container.querySelector("#gallery-content")!.getAttribute("tabindex"),
  ).toBe("-1");
  const navigation = container.querySelector("nav")!;
  expect(navigation.className).toContain("top-16");
  const links = navigation.querySelectorAll<HTMLAnchorElement>("a");
  expect(links).toHaveLength(6);
  const sections = Array.from(container.querySelectorAll("section"));
  sections.forEach((section, index) => {
    expect(section.className).toContain("scroll-mt-36");
    vi.spyOn(section, "getBoundingClientRect").mockReturnValue({
      top: index * 1000,
    } as DOMRect);
    expect(links[index].getAttribute("href")).toBe(`#${section.id}`);
  });
  act(() => frames.shift()!(0));
  expect(links[0].getAttribute("aria-current")).toBe("location");
  links[0].focus();
  const hash = window.location.hash;
  const scroller = links[0].parentElement!;
  vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue({
    left: 0,
    right: 300,
  } as DOMRect);
  vi.spyOn(links[5], "getBoundingClientRect").mockReturnValue({
    left: 850,
    right: 1000,
  } as DOMRect);
  sections.forEach((section) =>
    vi
      .mocked(section.getBoundingClientRect)
      .mockReturnValue({ top: 0 } as DOMRect),
  );
  act(() => window.dispatchEvent(new Event("scroll")));
  act(() => frames.shift()!(1));
  expect(links[5].getAttribute("aria-current")).toBe("location");
  expect(scroller.scrollLeft).toBe(700);
  expect(document.activeElement).toBe(links[0]);
  expect(window.location.hash).toBe(hash);
  expect(navigation.querySelectorAll("[aria-current]")).toHaveLength(1);
});

it("jumps gallery anchors immediately when reduced motion is preferred", () => {
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches: true,
  } as MediaQueryList);
  act(() =>
    root.render(
      <NavbarChromeContext.Provider
        value={{ setNavbarBackgroundPrimary: solid }}
      >
        <DesignSystemGallery copy={copy} />
      </NavbarChromeContext.Provider>,
    ),
  );
  const link = container.querySelector<HTMLAnchorElement>(
    'nav a[href="#controls"]',
  )!;
  const target = container.querySelector<HTMLElement>("#controls")!;
  const globalClick = vi.fn();
  window.addEventListener("click", globalClick);
  act(() => link.click());
  expect(scrollTo).toHaveBeenCalledExactlyOnceWith(target, { immediate: true });
  expect(document.activeElement).toBe(target);
  expect(window.location.hash).toBe("#controls");
  expect(globalClick).not.toHaveBeenCalled();
  window.removeEventListener("click", globalClick);
  window.history.replaceState(null, "", window.location.pathname);
});
