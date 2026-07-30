import { describe, expect, it } from "vitest";
import { getAccordionForStep } from "@/app/[locale]/journey/page";

describe("getAccordionForStep", () => {
  it("returns 'pax' for the pax substep — Travellers is a normal collapsible accordion item, same as Origin/Dates/Transport", () => {
    expect(getAccordionForStep("details", "pax")).toBe("pax");
  });

  it("still maps dates/transport/origin substeps under details", () => {
    expect(getAccordionForStep("details", "dates")).toBe("dates");
    expect(getAccordionForStep("details", "transport")).toBe("transport");
    expect(getAccordionForStep("details", "origin")).toBe("origin");
    expect(getAccordionForStep("details")).toBe("origin");
  });

  it("defaults to 'pax' (not 'origin') when no substep is requested and the travel type has the Travellers substep — e.g. clicking the 'Details and planning' tab itself, or advancing via Next", () => {
    expect(getAccordionForStep("details", undefined, "group")).toBe("pax");
    expect(getAccordionForStep("details", undefined, "family")).toBe("pax");
    expect(getAccordionForStep("details", undefined, "paws")).toBe("pax");
  });

  it("still defaults to 'origin' for travel types without the Travellers substep", () => {
    expect(getAccordionForStep("details", undefined, "couple")).toBe("origin");
    expect(getAccordionForStep("details", undefined, null)).toBe("origin");
  });

  it("an explicit substepId always wins over the travelType-based default", () => {
    expect(getAccordionForStep("details", "dates", "group")).toBe("dates");
    expect(getAccordionForStep("details", "origin", "group")).toBe("origin");
  });

  it("keeps existing budget/excuse/preferences behavior unchanged", () => {
    expect(getAccordionForStep("budget", "experience")).toBe("experience");
    expect(getAccordionForStep("budget")).toBe("travel-type");
    expect(getAccordionForStep("excuse", "refine-details")).toBe(
      "refine-details",
    );
    expect(getAccordionForStep("excuse")).toBe("excuse");
    expect(getAccordionForStep("preferences")).toBe("filters");
  });
});
