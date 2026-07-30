import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { JourneyDetailsStep } from "@/components/journey/JourneyDetailsStep";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const baseProps = {
  nights: 5,
  onNightsChange: vi.fn(),
  onOpenSection: vi.fn(),
  onOriginCityChange: vi.fn(),
  onOriginCountryChange: vi.fn(),
  onPaxAdultsChange: vi.fn(),
  onPaxMinorsChange: vi.fn(),
  onPaxPetsChange: vi.fn(),
  onStartDateChange: vi.fn(),
  onTransportOrderChange: vi.fn(),
  openSectionId: "origin",
  originCity: "",
  originCountry: "",
  paxAdults: 3,
  paxMinors: 1,
  paxPets: 2,
  startDate: undefined,
  transportOrder: [],
};

function renderStep(travelType: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<JourneyDetailsStep {...baseProps} travelType={travelType} />);
  });
  return { container, root };
}

describe("JourneyDetailsStep — Travellers substep", () => {
  it("renders the Travellers block always-visible, not inside a collapsible trigger, for group", () => {
    const { container, root } = renderStep("group");

    // No accordion trigger button wraps the pax label — plain heading only.
    const paxHeading = Array.from(container.querySelectorAll("h3")).find((h) =>
      h.textContent?.includes("Viajeros"),
    );
    expect(paxHeading).toBeTruthy();
    expect(paxHeading?.closest("button")).toBeNull();
    expect(paxHeading?.closest('[data-state]')).toBeNull();

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("shows Adults + Minors (no Pets) for group", () => {
    const { container, root } = renderStep("group");
    expect(container.querySelector("#pax-adults")).toBeTruthy();
    expect(container.querySelector("#pax-minors")).toBeTruthy();
    expect(container.querySelector("#pax-pets")).toBeNull();
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("shows Adults + Minors (no Pets) for family", () => {
    const { container, root } = renderStep("family");
    expect(container.querySelector("#pax-adults")).toBeTruthy();
    expect(container.querySelector("#pax-minors")).toBeTruthy();
    expect(container.querySelector("#pax-pets")).toBeNull();
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("shows Adults + Pets (no Minors) for paws", () => {
    const { container, root } = renderStep("paws");
    expect(container.querySelector("#pax-adults")).toBeTruthy();
    expect(container.querySelector("#pax-pets")).toBeTruthy();
    expect(container.querySelector("#pax-minors")).toBeNull();
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders no Travellers block at all for travel types outside scope (e.g. couple)", () => {
    const { container, root } = renderStep("couple");
    expect(container.querySelector("#pax-adults")).toBeNull();
    expect(container.querySelector("#pax-minors")).toBeNull();
    expect(container.querySelector("#pax-pets")).toBeNull();
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("uses plain number inputs (CountNumberInput), not the +/- QuantityStepper", () => {
    const { container, root } = renderStep("group");
    // QuantityStepper renders increase/decrease buttons with aria-labels;
    // the new plain inputs must not.
    expect(container.querySelector('[aria-label*="adultos" i]')).toBeNull();
    expect(container.querySelector('[aria-label*="Increase"]')).toBeNull();
    const adultsInput = container.querySelector(
      "#pax-adults",
    ) as HTMLInputElement | null;
    expect(adultsInput?.tagName).toBe("INPUT");
    expect(adultsInput?.value).toBe("3");
    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
