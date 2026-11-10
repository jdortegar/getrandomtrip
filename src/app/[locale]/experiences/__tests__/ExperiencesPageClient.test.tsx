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
vi.mock("@/components/ui/TabSelector", () => ({
  TabSelector: ({
    onTabChange,
    tabs,
  }: {
    onTabChange: (type: string) => void;
    tabs: { id: string; label: string }[];
  }) => (
    <div>
      {tabs.map((tab) => (
        <button
          data-tab={tab.id}
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  ),
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
    act(() =>
      container.querySelector<HTMLButtonElement>('[data-tab="couple"]')!.click(),
    );
    expect(container.textContent).toContain(`essenza:${offered ? 1000 : 350}`);
    act(() => root.unmount());
  },
);

it("uses one-word Spanish traveler type tab labels", () => {
  vi.stubEnv("NEXT_PUBLIC_RT_DEPLOY_ENV", "nonproduction");
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() =>
    root.render(
      <ExperiencesPageClient locale="es" tripperContext={null} />,
    ),
  );
  expect(container.textContent).toContain("Pareja");
  expect(container.textContent).toContain("Grupo");
  expect(container.textContent).toContain("Familia");
  expect(container.textContent).not.toContain("En Pareja");
  expect(container.textContent).not.toContain("En Grupo");
  expect(container.textContent).not.toContain("En Familia");
  act(() => root.unmount());
  vi.unstubAllEnvs();
});
