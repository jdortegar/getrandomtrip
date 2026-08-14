import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import {
  TripItineraryReference,
  type ExperienceItinerary,
} from "@/components/app/admin/trip-fulfillment/TripItineraryReference";
import type { MarketingDictionary } from "@/lib/types/dictionary";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy: MarketingDictionary["adminTripFulfillment"] = {
  itineraryReferenceBadge: "From {{experience}}",
  itineraryReferenceTitle: "Itinerary reference",
  itineraryReferenceBody: "Shared per experience, not editable here.",
  openInEditor: "Open in editor",
  itineraryEmpty: "No itinerary assigned yet.",
} as MarketingDictionary["adminTripFulfillment"];

const experienceItinerary: ExperienceItinerary = {
  title: "Wine Country Weekend",
  itinerary: [
    { title: "Touchdown", description: "<p>Arrival day.</p>", image: null },
    {
      title: "Into the Vines",
      description: "<p>A full day out. <strong>Don't miss it.</strong></p>",
      image: null,
    },
  ],
  inclusions: [],
  exclusions: [],
};

let container: HTMLDivElement;
let root: Root;

function render(itinerary: ExperienceItinerary | null) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <TripItineraryReference copy={copy} experienceItinerary={itinerary} />,
    );
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
});

describe("TripItineraryReference — regression: renders day.description as HTML, not escaped text", () => {
  it("renders RichTextInput/TinyMCE HTML tags as real markup, not literal text", () => {
    render(experienceItinerary);

    expect(container.textContent).not.toContain("<strong>");
    expect(container.textContent).not.toContain("<p>");

    const strongEls = container.querySelectorAll("strong");
    expect(strongEls).toHaveLength(1);
    expect(strongEls[0].textContent).toBe("Don't miss it.");
  });

  it("shows the empty state when no experience is assigned", () => {
    render(null);
    expect(container.textContent).toContain(copy.itineraryEmpty);
  });
});
