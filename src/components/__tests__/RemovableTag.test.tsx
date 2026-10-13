import { afterEach, beforeEach, expect, it, vi } from "vitest";
import RemovableTag from "@/components/RemovableTag";
import {
  createDomHarness,
  type DomHarness,
} from "@/components/ui/__tests__/test-dom-utils";

let harness: DomHarness;

beforeEach(() => {
  harness = createDomHarness();
});
afterEach(() => {
  harness.unmount();
});

const removeButton = () => harness.container.querySelector("button")!;

it("keeps the default remove label for existing callers", () => {
  harness.render(<RemovableTag item={{ key: "ar", value: "Argentina", onRemove: () => {} }} />);
  expect(removeButton().getAttribute("aria-label")).toBe("Quitar Argentina");
});

it("uses the caller-supplied remove label when provided", () => {
  const onRemove = vi.fn();
  harness.render(
    <RemovableTag
      item={{ key: "ar", value: "Argentina", onRemove }}
      removeLabel="Remove Argentina"
    />,
  );
  expect(removeButton().getAttribute("aria-label")).toBe("Remove Argentina");
  harness.click(removeButton());
  expect(onRemove).toHaveBeenCalledTimes(1);
});
