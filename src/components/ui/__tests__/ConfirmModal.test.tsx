import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Trash2 } from "lucide-react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ConfirmModal } from "../ConfirmModal";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(isConfirming = false, confirmingLabel?: string) {
  const onConfirm = vi.fn();
  act(() =>
    root.render(
      <ConfirmModal
        cancelLabel="Cancel"
        confirmLabel="Delete"
        confirmingLabel={confirmingLabel}
        description="This cannot be undone."
        icon={Trash2}
        isConfirming={isConfirming}
        onConfirm={onConfirm}
        onOpenChange={vi.fn()}
        open
        title="Delete item?"
        tone="danger"
      />,
    ),
  );
  return onConfirm;
}

function button(label: string) {
  return Array.from(document.querySelectorAll("button")).find(
    (element) => element.textContent?.trim() === label,
  )!;
}

it("keeps existing idle callers and their confirm icon working", () => {
  const onConfirm = render();
  expect(button("Delete").disabled).toBe(false);
  expect(button("Delete").getAttribute("aria-busy")).toBe("false");
  expect(button("Delete").querySelector("svg.lucide-trash-2")).not.toBeNull();
  act(() => button("Delete").click());
  expect(onConfirm).toHaveBeenCalledOnce();
});

it("renders accessible localized pending feedback and disables actions", () => {
  const onConfirm = render(true, "Deleting…");
  expect(button("Deleting…").disabled).toBe(true);
  expect(button("Deleting…").getAttribute("aria-busy")).toBe("true");
  expect(
    button("Deleting…")
      .querySelector("svg.animate-spin")
      ?.getAttribute("aria-hidden"),
  ).toBe("true");
  expect(button("Cancel").disabled).toBe(true);
  expect(document.querySelector('[data-slot="dialog-close"]')).toBeNull();
  act(() => button("Deleting…").click());
  expect(onConfirm).not.toHaveBeenCalled();

  render(false, "Deleting…");
  expect(button("Delete").disabled).toBe(false);
  expect(button("Delete").querySelector(".animate-spin")).toBeNull();
  expect(button("Cancel").disabled).toBe(false);
});

it("retains the caller's label when no pending label was supplied", () => {
  render(true);
  expect(button("Delete").disabled).toBe(true);
  expect(button("Delete").querySelector(".animate-spin")).not.toBeNull();
});
