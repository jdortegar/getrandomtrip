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

function renderStep(travelType: string, openSectionId = "origin") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <JourneyDetailsStep
        {...baseProps}
        openSectionId={openSectionId}
        travelType={travelType}
      />,
    );
  });
  return { container, root };
}

describe("JourneyDetailsStep — Travellers substep", () => {
  it("renders Travellers as a collapsible accordion trigger, same as Origin/Dates/Transport", () => {
    const { container, root } = renderStep("group");

    // "Viajeros" is the dropdown trigger label, not a plain heading — it
    // must be inside a Radix accordion trigger button with a data-state,
    // just like the Origin/Dates/Transport triggers.
    const paxLabel = Array.from(container.querySelectorAll("span")).find(
      (el) => el.textContent === "Viajeros",
    );
    expect(paxLabel).toBeTruthy();
    expect(paxLabel?.closest("button")).toBeTruthy();
    expect(paxLabel?.closest("[data-state]")).toBeTruthy();

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("shows Adults + Minors (no Pets) for group", () => {
    const { container, root } = renderStep("group", "pax");
    expect(container.querySelector("#pax-adults")).toBeTruthy();
    expect(container.querySelector("#pax-minors")).toBeTruthy();
    expect(container.querySelector("#pax-pets")).toBeNull();
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("shows Adults + Minors (no Pets) for family", () => {
    const { container, root } = renderStep("family", "pax");
    expect(container.querySelector("#pax-adults")).toBeTruthy();
    expect(container.querySelector("#pax-minors")).toBeTruthy();
    expect(container.querySelector("#pax-pets")).toBeNull();
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("shows Adults + Pets (no Minors) for paws", () => {
    const { container, root } = renderStep("paws", "pax");
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
    const { container, root } = renderStep("group", "pax");
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
