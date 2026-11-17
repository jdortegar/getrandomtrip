import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { TripGuide } from "@/components/app/dashboard/traveler/TripGuide";
import en from "@/dictionaries/en.json";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const copy = en.tripItinerary.guide;
let container: HTMLDivElement;
let root: Root;

function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(<TripGuide copy={copy} photo="/images/hero-image-1.jpeg" place="JUNÍN, ARGENTINA" />),
  );
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
});

describe("TripGuide", () => {
  it("renders the intro with the trip's place in the photo caption", () => {
    render();
    expect(container.textContent).toContain(copy.titleAccent);
    expect(container.querySelector("figcaption")?.textContent).toContain("JUNÍN, ARGENTINA / " + copy.photoTagline);
    const routeLink = container.querySelector('a[href="#itinerary"]');
    expect(routeLink?.textContent).toContain(copy.routeLink);
  });

  it("tags every static line as not coming from the database", () => {
    render();
    const tagged = Array.from(container.querySelectorAll('[data-component="PlaceholderTag"]'));
    expect(tagged).toHaveLength(4);
    for (const tag of tagged) expect(tag.textContent).toBe(copy.placeholderTag);
    // Title, lead, body and the photo tagline are static; the place is data.
    expect(container.querySelector("figcaption [data-component='PlaceholderTag']")).not.toBeNull();
    expect(container.querySelector("h2 [data-component='PlaceholderTag']")).toBeNull();
  });
});
