import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import JourneyProgressSidebar from "@/components/journey/JourneyProgressSidebar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let mockSearch = "";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

const tabs = [
  {
    id: "details",
    label: "Details",
    substeps: [
      { id: "origin", title: "Origin", description: "" },
      { id: "dates", title: "Dates", description: "" },
      { id: "transport", title: "Transport", description: "" },
    ],
  },
  {
    id: "preferences",
    label: "Preferences",
    substeps: [{ id: "filters", title: "Filters", description: "" }],
  },
];

function renderSidebar(props: Partial<React.ComponentProps<typeof JourneyProgressSidebar>>) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <JourneyProgressSidebar
        activeTab="details"
        addonsComingSoonLabel="Coming soon"
        tabs={tabs}
        {...props}
      />,
    );
  });
  return { container, root };
}

function bulletClasses(container: HTMLElement, substepTitle: string): string {
  const heading = Array.from(container.querySelectorAll("h3")).find((h) =>
    h.textContent?.includes(substepTitle),
  );
  const row = heading?.closest('[role="button"]');
  const bullet = row?.querySelector(".w-2.h-2.rounded-full");
  return bullet?.className ?? "";
}

describe("JourneyProgressSidebar — completion overrides (opt-in, additive)", () => {
  it("without the new props: substep dots use the existing search-param based check (unchanged behavior)", () => {
    mockSearch = ""; // nothing set -> origin/dates/transport all incomplete
    const { container, root } = renderSidebar({});

    // "Dates" (substepIndex 1, not the default-active first substep) has no
    // solid fill — it isn't marked complete by the internal search-param check.
    expect(bulletClasses(container, "Dates")).not.toContain("bg-secondary");

    act(() => root.unmount());
    container.remove();
  });

  it("without the new props: a fully-set search param still marks a substep complete (regression guard for existing callers)", () => {
    mockSearch = "originCountry=Argentina&originCity=Cordoba";
    const { container, root } = renderSidebar({});

    expect(bulletClasses(container, "Origin")).toContain("bg-secondary");

    act(() => root.unmount());
    container.remove();
  });

  it("with substepCompletionOverrides: overrides the specific tab:substep key even when search params say incomplete", () => {
    mockSearch = ""; // raw params say incomplete
    const { container, root } = renderSidebar({
      substepCompletionOverrides: { "details:origin": true },
    });

    // Overridden key reads complete...
    expect(bulletClasses(container, "Origin")).toContain("bg-secondary");
    // ...but a sibling substep not present in the override map keeps using
    // the internal search-param check (still incomplete here).
    expect(bulletClasses(container, "Dates")).toContain("border-gray-300");
    expect(bulletClasses(container, "Dates")).not.toContain("bg-secondary");

    act(() => root.unmount());
    container.remove();
  });

  it("with substepCompletionOverrides: can also override to false even when raw search params say complete", () => {
    mockSearch = "originCountry=Argentina&originCity=Cordoba";
    const { container, root } = renderSidebar({
      substepCompletionOverrides: { "details:origin": false },
    });

    expect(bulletClasses(container, "Origin")).not.toContain("bg-secondary");

    act(() => root.unmount());
    container.remove();
  });

  it("with tabCompletionOverrides: overrides only the listed tab id's own dot, leaving other tabs on the internal check", () => {
    mockSearch = "";
    const { container, root } = renderSidebar({
      tabCompletionOverrides: { details: true },
    });

    // "details" tab circle should render a checkmark (Check icon), not the
    // step number "1", because it's overridden to complete.
    const circles = container.querySelectorAll(
      ".w-10.h-10.rounded-full",
    );
    expect(circles[0]?.querySelector("svg")).toBeTruthy();
    // "preferences" (not overridden) with nothing set in search params stays
    // incomplete -> renders its step number, not a checkmark.
    expect(circles[1]?.textContent?.trim()).toBe("2");

    act(() => root.unmount());
    container.remove();
  });
});
