import { describe, expect, it } from "vitest";
import { getAccordionForStep } from "@/app/[locale]/journey/page";

describe("getAccordionForStep", () => {
  it("returns '' for the pax substep — Travellers is no longer a collapsible accordion item, clicking it must not force any section open", () => {
    expect(getAccordionForStep("details", "pax")).toBe("");
  });

  it("still maps dates/transport/origin substeps under details", () => {
    expect(getAccordionForStep("details", "dates")).toBe("dates");
    expect(getAccordionForStep("details", "transport")).toBe("transport");
    expect(getAccordionForStep("details", "origin")).toBe("origin");
    expect(getAccordionForStep("details")).toBe("origin");
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
