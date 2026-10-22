import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DesignSystemGallery } from "../DesignSystemGallery";
import { NavbarChromeContext } from "@/context/NavbarChromeContext";
import {
  DESIGN_SYSTEM_BRAND_SECTIONS,
  DESIGN_SYSTEM_COMPONENT_SECTIONS,
} from "@/lib/constants/DESIGN_SYSTEM_GALLERY";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { DesignSystemDict } from "@/lib/types/dictionary";

const scrollTo = vi.hoisted(() => vi.fn());
vi.mock("lenis/react", () => ({ useLenis: () => ({ scrollTo }) }));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement;
let root: Root;
let frames: FrameRequestCallback[];
const copy = en.designSystem as DesignSystemDict;
const solid = vi.fn();
const agentDocsHref = "/design-system/llms";
const brandHref = "/design-system";
const componentsHref = "/design-system/components";

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

function renderGallery(
  view: "brand" | "components" = "brand",
  dictionary: DesignSystemDict = copy,
) {
  act(() =>
    root.render(
      <NavbarChromeContext.Provider
        value={{ setNavbarBackgroundPrimary: solid }}
      >
        <DesignSystemGallery
          agentDocsHref={agentDocsHref}
          brandHref={brandHref}
          componentsHref={componentsHref}
          copy={dictionary}
          view={view}
        />
      </NavbarChromeContext.Provider>,
    ),
  );
}

it.each([en.designSystem, es.designSystem])(
  "keeps brand guidelines and UI components on separate gallery views",
  (raw) => {
    const localized = raw as DesignSystemDict;
    renderGallery("brand", localized);
    const groups = Array.from(
      container.querySelectorAll<HTMLElement>('nav [role="group"]'),
    );
    expect(groups).toHaveLength(2);
    const viewLinks = Array.from(groups[0]!.querySelectorAll("a"));
    expect(viewLinks.map((link) => link.textContent)).toEqual([
      localized.groups.brand,
      localized.groups.components,
    ]);
    expect(viewLinks[0]!.getAttribute("href")).toBe(brandHref);
    expect(viewLinks[1]!.getAttribute("href")).toBe(componentsHref);
    expect(viewLinks[0]!.getAttribute("aria-current")).toBe("page");
    expect(viewLinks[1]!.getAttribute("aria-current")).toBeNull();
    expect(
      Array.from(groups[1]!.querySelectorAll("a")).map((a) =>
        a.getAttribute("href"),
      ),
    ).toEqual(DESIGN_SYSTEM_BRAND_SECTIONS.map((id) => `#${id}`));
    for (const id of DESIGN_SYSTEM_BRAND_SECTIONS)
      expect(container.querySelector(`section#${id}`)).not.toBeNull();
    for (const id of DESIGN_SYSTEM_COMPONENT_SECTIONS)
      expect(container.querySelector(`section#${id}`)).toBeNull();
    const voice = container.querySelector("#voice")!;
    const subtitle = voice.querySelector("[data-section-lead]")!;
    expect(subtitle.textContent).toBe(localized.voice.intro.title);
    expect(container.querySelector("#foundations")).toBeNull();
  },
);

it.each(["brand", "components"] as const)(
  "introduces the %s gallery without a jump CTA or overview card",
  (view) => {
    renderGallery(view);
    const hero = container.querySelector("[data-gallery-hero]")!;
    const intro =
      view === "brand" ? en.designSystem.hero : en.designSystem.componentsHero;
    expect(hero.textContent).toContain(intro.title);
    expect(hero.textContent).toContain(intro.localOnly);
    expect(hero.querySelector("aside")).toBeNull();
    expect(hero.querySelector("button")).toBeNull();
    expect(
      hero.querySelector<HTMLAnchorElement>("a")?.getAttribute("href"),
    ).toBe(agentDocsHref);
  },
);

it("numbers brand sections on the brand page and component sections on the components page", () => {
  renderGallery("brand");
  expect(solid).toHaveBeenCalledWith(true);
  expect(container.querySelector("[data-gallery-view]")!.getAttribute("data-gallery-view")).toBe(
    "brand",
  );
  expect(
    container.querySelector("#gallery-content")!.getAttribute("tabindex"),
  ).toBe("-1");
  const brandLinks = container.querySelectorAll<HTMLAnchorElement>(
    'nav [role="group"]:last-child a',
  );
  expect(brandLinks).toHaveLength(DESIGN_SYSTEM_BRAND_SECTIONS.length);
  expect(brandLinks[0]!.textContent).toContain("01");
  expect(container.querySelectorAll("section")).toHaveLength(
    DESIGN_SYSTEM_BRAND_SECTIONS.length,
  );

  renderGallery("components");
  expect(
    container
      .querySelector("[data-gallery-view]")!
      .getAttribute("data-gallery-view"),
  ).toBe("components");
  const componentLinks = container.querySelectorAll<HTMLAnchorElement>(
    'nav [role="group"]:last-child a',
  );
  expect(componentLinks).toHaveLength(DESIGN_SYSTEM_COMPONENT_SECTIONS.length);
  expect(componentLinks[0]!.textContent).toContain("01");
  expect(container.querySelectorAll("section")).toHaveLength(
    DESIGN_SYSTEM_COMPONENT_SECTIONS.length,
  );
  for (const id of DESIGN_SYSTEM_COMPONENT_SECTIONS)
    expect(container.querySelector(`section#${id}`)).not.toBeNull();
  for (const id of DESIGN_SYSTEM_BRAND_SECTIONS)
    expect(container.querySelector(`section#${id}`)).toBeNull();
});

it("uses gallery scrollspy on the current view without changing focus or hash", () => {
  renderGallery("brand");
  const navigation = container.querySelector("nav")!;
  expect(navigation.className).toContain("top-16");
  const sectionLinks = [
    ...navigation.querySelectorAll<HTMLAnchorElement>(
      'a[href^="#"]',
    ),
  ];
  const sections = Array.from(container.querySelectorAll("section"));
  expect(sectionLinks).toHaveLength(sections.length);
  sections.forEach((section, index) => {
    expect(section.className).toContain("scroll-mt-36");
    vi.spyOn(section, "getBoundingClientRect").mockReturnValue({
      top: index * 1000,
    } as DOMRect);
    expect(sectionLinks[index]!.getAttribute("href")).toBe(`#${section.id}`);
  });
  act(() => frames.shift()!(0));
  expect(sectionLinks[0]!.getAttribute("aria-current")).toBe("location");
  sectionLinks[0]!.focus();
  const hash = window.location.hash;
  const scroller = navigation.querySelector<HTMLElement>(".overflow-x-auto")!;
  vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue({
    left: 0,
    right: 300,
  } as DOMRect);
  const last = sectionLinks[sectionLinks.length - 1]!;
  vi.spyOn(last, "getBoundingClientRect").mockReturnValue({
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
  expect(last.getAttribute("aria-current")).toBe("location");
  expect(scroller.scrollLeft).toBe(700);
  expect(document.activeElement).toBe(sectionLinks[0]);
  expect(window.location.hash).toBe(hash);
  expect(navigation.querySelectorAll("[aria-current=location]")).toHaveLength(
    1,
  );
});

it("jumps gallery anchors immediately when reduced motion is preferred", () => {
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches: true,
  } as MediaQueryList);
  renderGallery("components");
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
