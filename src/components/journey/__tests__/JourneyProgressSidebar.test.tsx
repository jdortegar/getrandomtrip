import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import JourneyProgressSidebar from "@/components/journey/JourneyProgressSidebar";


(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let mockSearch = "";
const cleanups: (() => void)[] = [];
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
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
    substeps: [
      { id: "filters", title: "Filters", description: "" },
      { id: "addons", title: "Add-ons", description: "" },
    ],
  },
];

function renderSidebar(
  props: Partial<React.ComponentProps<typeof JourneyProgressSidebar>>,
) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <JourneyProgressSidebar
        activeTab="details"
        addonsComingSoonLabel="Coming soon"
        completionLabels={{ completed: "Completed", incomplete: "Incomplete" }}
        tabs={tabs}
        {...props}
      />,
    );
  });
  cleanups.push(() => {
    act(() => root.unmount());
    container.remove();
  });
  return { container, root };
}

function row(container: HTMLElement, title: string): HTMLElement {
  const heading = Array.from(container.querySelectorAll("h2, h3")).find((h) =>
    h.textContent?.startsWith(title),
  );
  const button = heading?.closest<HTMLElement>('[role="button"]');
  if (!button) throw new Error(`Missing step: ${title}`);
  return button;
}

function description(container: HTMLElement, title: string): string | null {
  const id = row(container, title).getAttribute("aria-describedby");
  return id ? (document.getElementById(id)?.textContent ?? null) : null;
}

function activate(button: HTMLElement, action: string) {
  act(() =>
    button.dispatchEvent(
      action === "click"
        ? new MouseEvent("click", { bubbles: true })
        : new KeyboardEvent("keydown", { key: action, bubbles: true }),
    ),
  );
}

describe("JourneyProgressSidebar — accessible completion", () => {
  it("reports incomplete substeps when raw parameters are empty", () => {
    mockSearch = "";
    const { container } = renderSidebar({});
    expect(description(container, "Dates")).toBe("Incomplete");
  });

  it("uses raw parameters when no completion overrides are supplied", () => {
    mockSearch = "originCountry=Argentina&originCity=Cordoba";
    const { container } = renderSidebar({});
    expect(description(container, "Origin")).toBe("Completed");
    expect(description(container, "Dates")).toBe("Incomplete");
  });

  it("overrides a substep to true without changing its sibling", () => {
    mockSearch = "";
    const { container } = renderSidebar({
      substepCompletionOverrides: { "details:origin": true },
    });
    expect(description(container, "Origin")).toBe("Completed");
    expect(description(container, "Dates")).toBe("Incomplete");
  });

  it("overrides a substep to false even when raw parameters are complete", () => {
    mockSearch = "originCountry=Argentina&originCity=Cordoba";
    const { container } = renderSidebar({
      substepCompletionOverrides: { "details:origin": false },
    });
    expect(description(container, "Origin")).toBe("Incomplete");
  });

  it("overrides only the specified tab", () => {
    mockSearch = "";
    const { container } = renderSidebar({
      tabCompletionOverrides: { details: true },
    });
    expect(description(container, "Details")).toBe("Completed");
    expect(description(container, "Preferences")).toBe("Incomplete");
  });

  it("keeps active-substep ordering ahead of overrides and raw parameters", () => {
    mockSearch = "transportOrder=plane,train,bus,ship";
    const { container } = renderSidebar({
      activeSubstepId: "dates",
      substepCompletionOverrides: {
        "details:origin": false,
        "details:dates": true,
      },
    });
    expect(description(container, "Origin")).toBe("Completed");
    expect(description(container, "Dates")).toBe("Incomplete");
    expect(description(container, "Transport")).toBe("Incomplete");
  });

  it.each([
    { completedTabIds: undefined },
    { completedTabIds: [] },
    { completedTabIds: ["details"] },
  ])(
    "resolves tab overrides ahead of completed IDs $completedTabIds and URL fallback",
    ({ completedTabIds }) => {
      mockSearch =
        "originCountry=Argentina&originCity=Cordoba&startDate=2026-10-01&nights=2&transportOrder=plane,train,bus,ship";
      const { container } = renderSidebar({
        completedTabIds,
        tabCompletionOverrides: { details: false },
      });
      expect(description(container, "Details")).toBe("Incomplete");
      expect(description(container, "Preferences")).toBe(
        completedTabIds ? "Incomplete" : "Completed",
      );
    },
  );

  it("uses explicit completed IDs instead of URL status when provided", () => {
    mockSearch = "";
    const { container } = renderSidebar({ completedTabIds: ["details"] });
    expect(description(container, "Details")).toBe("Completed");
    expect(description(container, "Preferences")).toBe("Incomplete");
  });

  it("resolves localized descriptions within separate sidebar instances", () => {
    mockSearch = "originCountry=Argentina&originCity=Cordoba";
    const english = renderSidebar({
      completionLabels: en.journey.completionLabels,
    }).container;
    const spanish = renderSidebar({
      completionLabels: es.journey.completionLabels,
    }).container;
    expect(description(english, "Origin")).toBe("Completed");
    expect(description(english, "Dates")).toBe("Incomplete");
    expect(description(spanish, "Origin")).toBe("Completado");
    expect(description(spanish, "Dates")).toBe("Incompleto");
    const ids = [english, spanish].flatMap((container) =>
      Array.from(container.querySelectorAll("[id]"), (element) => element.id),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps descriptions opt-in for existing callers", () => {
    mockSearch = "";
    const onStepClick = vi.fn();
    const { container } = renderSidebar({
      completionLabels: undefined,
      onStepClick,
    });
    expect(row(container, "Details").hasAttribute("aria-describedby")).toBe(
      false,
    );
    expect(row(container, "Origin").hasAttribute("aria-describedby")).toBe(
      false,
    );
    act(() => row(container, "Details").click());
    expect(onStepClick.mock.calls).toEqual([["details"]]);
  });

  it.each(["click", "Enter", " "])(
    "preserves %j tab and substep navigation without bubbling twice",
    (action) => {
      mockSearch = "";
      const onStepClick = vi.fn();
      const { container } = renderSidebar({ onStepClick });
      activate(row(container, "Preferences"), action);
      activate(row(container, "Dates"), action);
      expect(onStepClick.mock.calls).toEqual([
        ["preferences"],
        ["details", "dates"],
      ]);
    },
  );

  it.each(["click", "Enter", " "])(
    "keeps disabled add-ons Coming soon, not completed or navigable via %j",
    (action) => {
      mockSearch = "";
      const onStepClick = vi.fn();
      const { container } = renderSidebar({
        activeTab: "preferences",
        onStepClick,
      });
      const addons = row(container, "Add-ons");
      expect(addons.getAttribute("aria-disabled")).toBe("true");
      expect(addons.tabIndex).toBe(-1);
      expect(description(container, "Add-ons")).toBe("Coming soon");
      activate(addons, action);
      expect(onStepClick).not.toHaveBeenCalled();
    },
  );
});
