import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/components/Hero", () => ({ default: () => null }));
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
  TravelerTypesCarousel: ({
    onSelect,
  }: {
    onSelect: (type: string) => void;
  }) => <button onClick={() => onSelect("couple")}>Couple</button>,
}));
import ExperiencesPageClient from "../ExperiencesPageClient";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
it.each([true, false])(
  "uses applicable public attribution, offered=%s",
  (offered) => {
    const container = document.createElement("div");
    const root = createRoot(container);
    act(() =>
      root.render(
        <ExperiencesPageClient
          locale="en"
          tripperContext={{
            name: "Tripper",
            avatarUrl: null,
            location: null,
            allowedTypes: offered ? ["couple"] : [],
            allowedLevelsByType: {},
            priceOverrides: { couple: { essenza: 1000 } },
          }}
        />,
      ),
    );
    act(() => container.querySelector("button")!.click());
    expect(container.textContent).toContain(`essenza:${offered ? 1000 : 350}`);
    act(() => root.unmount());
  },
);
