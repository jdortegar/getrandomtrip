import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({
  useRouter: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/by-type/TypePlanner", () => ({
  default: ({
    content,
  }: {
    content: { levels: { id: string; price: number }[] };
  }) => (
    <div>
      {content.levels.map((level) => (
        <span key={level.id}>
          {level.id}:{level.price}
        </span>
      ))}
    </div>
  ),
}));
vi.mock("@/components/landing/exploration/TravelerTypesCarousel", () => ({
  TravelerTypesCarousel: () => null,
}));
import BudgetStep from "../BudgetStep";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
it.each([true, false])(
  "preserves booking pricing separately from catalog curation, bound=%s",
  (bound) => {
    const container = document.createElement("div");
    const root = createRoot(container);
    act(() =>
      root.render(
        <BudgetStep
          accordionValue="experience"
          allowedTypes={[]}
          allowedLevelsByType={{}}
          bookingPriceOverrides={
            bound ? { couple: { essenza: 1000 } } : undefined
          }
          experienceContent=""
          handleExperienceSelect={() => {}}
          handleTravelTypeSelect={() => {}}
          labels={{
            browseGeneralExperiences: "Browse",
            experienceLabel: "Level",
            experienceStepDescription: "Select",
            noLevelsAvailable: "None",
            noTripperExperiences: "None",
            selectTravelTypeFirst: "Select",
            travelTypeLabel: "Type",
          }}
          locale="en"
          onAccordionValueChange={() => {}}
          selectedTravelType="couple"
          travelerType="couple"
          travelTypeContent=""
          tripperPriceOverrides={{ couple: { essenza: 1500 } }}
        />,
      ),
    );
    expect(container.textContent).toContain(`essenza:${bound ? 1000 : 350}`);
    act(() => root.unmount());
  },
);
