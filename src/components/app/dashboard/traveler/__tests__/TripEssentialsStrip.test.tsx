import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { TripEssentialsStrip } from "../TripEssentialsStrip";
import type { TripItineraryDict } from "@/lib/types/dictionary";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy: TripItineraryDict["essentials"] = {
  lengthLabel: "Length",
  nightsValue: "{{n}} Nights",
  daysSub: "{{n}} days total",
  partyLabel: "Party",
  paxValue: "{{n}} travelers",
  originLabel: "Origin",
  travelTypeLabel: "Travel type",
  travelTypeValues: {
    solo: "Solo",
    couple: "Couple",
    family: "Family",
    group: "Group",
    honeymoon: "Honeymoon",
    paws: "With pets",
  },
};

let container: HTMLDivElement;
let root: Root;

function render(
  nights: number,
  pax: number,
  origin = "Buenos Aires, Argentina",
  travelType = "couple",
) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <TripEssentialsStrip
        copy={copy}
        nights={nights}
        origin={origin}
        pax={pax}
        travelType={travelType}
      />,
    );
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
});

describe("TripEssentialsStrip — Length, Party, Origin, Travel type", () => {
  it("renders exactly four items", () => {
    render(2, 2);
    const items = container.querySelectorAll("[class*='essentialsItem']");
    expect(items).toHaveLength(4);
  });

  it("renders real nights/pax/origin values", () => {
    render(5, 3, "Santiago, Chile");
    const text = container.textContent ?? "";
    expect(text).toContain("5 Nights");
    expect(text).toContain("3 travelers");
    expect(text).toContain("6 days total");
    expect(text).toContain("Santiago, Chile");
  });

  it("renders the localized label for a known travel type", () => {
    render(2, 2, "Buenos Aires, Argentina", "honeymoon");
    const text = container.textContent ?? "";
    expect(text).toContain("Honeymoon");
  });

  it("falls back to the raw type value for an unknown travel type", () => {
    render(2, 2, "Buenos Aires, Argentina", "mystery-type");
    const text = container.textContent ?? "";
    expect(text).toContain("mystery-type");
  });

  it("never renders district, airport, or room-type text", () => {
    render(2, 2);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/district/i);
    expect(text).not.toMatch(/airport/i);
    expect(text).not.toMatch(/room/i);
    expect(text).not.toMatch(/\bbase\b/i);
  });
});
