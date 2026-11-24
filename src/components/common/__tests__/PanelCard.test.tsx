import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it } from "vitest";
import { PanelCard } from "@/components/common/PanelCard";

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

it("renders the title and meta above the content", () => {
  render(
    <PanelCard meta="3 items" title="Add-ons">
      <p>body</p>
    </PanelCard>,
  );

  expect(container.querySelector("h3")?.textContent).toBe("Add-ons");
  expect(container.textContent).toContain("3 items");
  expect(container.textContent).toContain("body");
});

it("is a bare shell without a title", () => {
  render(
    <PanelCard meta="ignored">
      <p>body</p>
    </PanelCard>,
  );

  expect(container.querySelector("header")).toBeNull();
  expect(container.textContent).toBe("body");
});
