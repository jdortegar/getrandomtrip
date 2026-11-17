import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { ButtonV2 } from "@/components/ui/ButtonV2";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function render(node: React.ReactNode) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(node));
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
});

it("renders a square, sentence-case primary button that lifts on hover, except with reduced motion", () => {
  const onClick = vi.fn();
  render(<ButtonV2 onClick={onClick}>Reveal my destination</ButtonV2>);
  const button = container.querySelector("button")!;

  expect(button.dataset.slot).toBe("button-v2");
  expect(button.className).toContain("bg-primary");
  expect(button.className).toContain("rounded-none");
  expect(button.className).toContain("normal-case");
  expect(button.className).toContain("hover:-translate-y-0.5");
  expect(button.className).toContain("motion-reduce:hover:translate-y-0");

  act(() => button.click());
  expect(onClick).toHaveBeenCalledTimes(1);
});

it("styles a child link with asChild and keeps the data-slot that exempts it from link resets", () => {
  render(
    <ButtonV2 asChild size="sm" variant="light">
      <a href="#guide">Explore my trip</a>
    </ButtonV2>,
  );
  const link = container.querySelector("a")!;

  expect(link.getAttribute("href")).toBe("#guide");
  expect(link.dataset.slot).toBe("button-v2");
  expect(link.className).toContain("bg-ground");
  expect(link.className).toContain("hover:bg-feature");
  expect(link.className).toContain("min-h-11");
});

it("renders an icon-only outline button at a 44px target", () => {
  render(
    <ButtonV2 aria-label="Download" size="icon" variant="outline">
      <svg />
    </ButtonV2>,
  );
  const button = container.querySelector("button")!;

  expect(button.getAttribute("aria-label")).toBe("Download");
  expect(button.className).toContain("size-11");
  expect(button.className).toContain("border-primary");
});
