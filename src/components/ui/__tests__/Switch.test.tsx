import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { Switch } from "@/components/ui/Switch";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function render(checked: boolean, onCheckedChange = vi.fn()) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<Switch checked={checked} onCheckedChange={onCheckedChange} />));
  return container.querySelector<HTMLButtonElement>('[role="switch"]')!;
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
});

it("uses Deep Teal (primary) when on — never Mineral Sage", () => {
  const toggle = render(true);
  expect(toggle.getAttribute("aria-checked")).toBe("true");
  expect(toggle.className).toContain("bg-primary");
  expect(toggle.className).not.toContain("bg-secondary");
});

it("stays neutral grey when off and reports the toggled value", () => {
  const onCheckedChange = vi.fn();
  const toggle = render(false, onCheckedChange);
  expect(toggle.className).toContain("bg-gray-200");
  act(() => toggle.click());
  expect(onCheckedChange).toHaveBeenCalledWith(true);
});
