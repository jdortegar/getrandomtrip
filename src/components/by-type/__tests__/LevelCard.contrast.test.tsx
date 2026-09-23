import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getPlannerContentForType } from "@/lib/utils/experiencesData";
import LevelCard from "../shared/LevelCard";

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
  useRouter: () => ({ push: vi.fn() }),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
const level = getPlannerContentForType("couple", "en").levels[0];
beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
});
afterEach(() => act(() => root.unmount()));

it("changes only the surface between white and off-white cards", () => {
  act(() =>
    root.render(
      <LevelCard
        featured
        level={level}
        selected
        showRandomtripBadge
        variant="light"
      />,
    ),
  );
  const childClasses = () =>
    Array.from(
      container.firstElementChild!.querySelectorAll("[class]"),
      (element) => element.getAttribute("class"),
    );
  const whiteChildClasses = childClasses();
  const whiteCardClass = container.firstElementChild!.getAttribute("class");
  act(() =>
    root.render(
      <LevelCard
        featured
        level={level}
        selected
        showRandomtripBadge
        variant="off-white"
      />,
    ),
  );
  expect(container.firstElementChild!.classList.contains("bg-ground")).toBe(
    true,
  );
  expect(container.firstElementChild!.getAttribute("class")).toBe(
    whiteCardClass!.replace("bg-white", "bg-ground"),
  );
  expect(childClasses()).toEqual(whiteChildClasses);
  expect(container.querySelector(".text-ground, .bg-secondary")).toBeNull();
});

it.each(["light", "off-white"] as const)(
  "uses ink CTA labels without changing the %s card palette",
  (variant) => {
    act(() => root.render(<LevelCard level={level} variant={variant} />));
    expect(container.querySelector("h3")?.classList.contains("text-ink")).toBe(
      true,
    );
    expect(
      container.querySelector("p")?.classList.contains("text-gray-600"),
    ).toBe(true);
    const cta = container.querySelector("a")!;
    for (const className of [
      "bg-feature",
      "border-feature",
      "text-ink",
      "hover:bg-feature/90",
      "hover:border-feature/90",
      "focus-visible:border-ring",
      "focus-visible:ring-ring/50",
    ])
      expect(cta.classList.contains(className)).toBe(true);
    expect(cta.classList.contains("bg-secondary-foreground")).toBe(false);
    expect(cta.classList.contains("text-white")).toBe(false);
  },
);

it("keeps caller CTA class overrides after ordinary off-white defaults", () => {
  const override =
    "bg-white text-primary hover:bg-white hover:text-primary focus-visible:bg-white focus-visible:text-primary";
  act(() =>
    root.render(
      <LevelCard ctaClassName={override} level={level} variant="off-white" />,
    ),
  );
  const cta = container.querySelector("a")!;
  for (const className of override.split(" "))
    expect(cta.classList.contains(className)).toBe(true);
  for (const className of [
    "bg-feature",
    "text-ink",
    "hover:bg-feature/90",
    "hover:text-ink",
    "focus-visible:bg-secondary-foreground",
    "focus-visible:text-ink",
  ]) {
    expect(cta.classList.contains(className)).toBe(false);
  }
});
