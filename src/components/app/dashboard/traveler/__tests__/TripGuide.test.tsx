import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TripGuide } from "@/components/app/dashboard/traveler/TripGuide";
import en from "@/dictionaries/en.json";

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// Same approach as the shared carousels' own tests: a minimal fake Embla API
// (what the shared carousel's arrows and the counter read).
const embla = vi.hoisted(() => ({ api: null as unknown }));
vi.mock("embla-carousel-react", () => ({
  default: () => [() => {}, embla.api],
}));

function fakeEmbla(count: number) {
  let index = 0;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const snaps = Array.from({ length: count }, (_, i) => i);
  const api = {
    on: (_event: string, callback: () => void) => {
      listeners.add(callback);
      return api;
    },
    off: (_event: string, callback: () => void) => {
      listeners.delete(callback);
      return api;
    },
    selectedScrollSnap: () => index,
    scrollSnapList: () => snaps,
    canScrollPrev: () => count > 1,
    canScrollNext: () => count > 1,
    scrollNext: vi.fn(() => {
      index = (index + 1) % count;
      notify();
    }),
    scrollPrev: vi.fn(() => {
      index = (index - 1 + count) % count;
      notify();
    }),
    scrollTo: vi.fn((i: number) => {
      index = i;
      notify();
    }),
  };
  return api;
}

const copy = en.tripItinerary.guide;
let container: HTMLDivElement;
let root: Root;

function render(props: Partial<Parameters<typeof TripGuide>[0]> = {}) {
  const photos = props.photos ?? ["/a.jpg"];
  embla.api = photos.length > 1 ? fakeEmbla(photos.length) : undefined;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <TripGuide
        copy={copy}
        place="JUNÍN, ARGENTINA"
        {...props}
        photos={photos}
      />,
    ),
  );
}

const tags = () =>
  container.querySelectorAll('[data-component="PlaceholderTag"]');
const button = (label: string) =>
  container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);

beforeEach(() => {
  embla.api = null;
});

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
});

describe("TripGuide — data", () => {
  it("uses the experience title, description and stay, with no placeholder tags", () => {
    render({
      title: "Two days to share the road",
      body: "Room to talk on the way.",
      stay: "Estancia La Oriental",
    });

    expect(container.querySelector("h2")?.textContent).toBe(
      "Two days to share the road",
    );
    expect(container.textContent).toContain("Room to talk on the way.");
    expect(container.querySelector("figcaption")?.textContent).toBe(
      "JUNÍN, ARGENTINA / Estancia La Oriental",
    );
    // The lead is fixed brand copy and carries no tag either.
    expect(container.textContent).toContain(copy.lead.split("\n")[0]);
    expect(tags()).toHaveLength(0);
    expect(container.textContent).not.toContain(copy.body);
    expect(container.textContent).not.toContain(copy.photoTagline);
  });

  it("falls back to static copy, tagged, for every empty slot", () => {
    render({ title: "  ", body: null, stay: undefined });

    expect(container.querySelector("h2")?.textContent).toContain(
      copy.titleAccent,
    );
    expect(container.textContent).toContain(copy.body);
    expect(container.querySelector("figcaption")?.textContent).toContain(
      "JUNÍN, ARGENTINA / " + copy.photoTagline,
    );
    expect(tags()).toHaveLength(3);
    for (const tag of tags()) expect(tag.textContent).toBe(copy.placeholderTag);
  });

  it("links down to the itinerary", () => {
    render();
    expect(
      container.querySelector('a[href="#itinerary"]')?.textContent,
    ).toContain(copy.routeLink);
  });
});

describe("TripGuide — photo carousel", () => {
  const counter = () =>
    container
      .querySelector('[aria-live="polite"]')
      ?.textContent?.replace(/\s+/g, " ");

  it("shows one slide per photo, a counter and localized arrows bottom right — no dots", () => {
    render({ photos: ["/a.jpg", "/b.jpg", "/c.jpg"] });

    expect(
      container
        .querySelector('[aria-roledescription="carousel"]')
        ?.getAttribute("aria-label"),
    ).toBe(copy.photosLabel);
    expect(
      container.querySelectorAll('[aria-roledescription="slide"]'),
    ).toHaveLength(3);
    expect(counter()).toBe("01 / 03");
    expect(container.querySelector('button[aria-label^="Go to"]')).toBeNull();

    act(() => button(copy.photoNext)!.click());
    expect(counter()).toBe("02 / 03");

    act(() => button(copy.photoPrev)!.click());
    act(() => button(copy.photoPrev)!.click());
    expect(counter()).toBe("03 / 03");
  });

  it("renders a single photo without controls", () => {
    render({ photos: ["/only.jpg"] });

    expect(
      container.querySelectorAll('[aria-roledescription="slide"]'),
    ).toHaveLength(1);
    expect(button(copy.photoNext)).toBeNull();
    expect(counter()).toBeUndefined();
  });
});
