import { useState } from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FormField } from "../FormField";
import type { FieldPeek } from "../field-peek";
import { createDomHarness, type DomHarness } from "./test-dom-utils";

let harness: DomHarness;

beforeEach(() => {
  harness = createDomHarness();
});

afterEach(() => {
  harness.unmount();
});

const baseTooltip = {
  showOriginal: "Click to see original content",
  showSuggestion: "Click to see admin's suggestion",
};

function PeekHarness({
  originalValue = "Original text",
  type,
}: {
  originalValue?: string;
  type?: string;
}) {
  const [active, setActive] = useState(false);
  const peek: FieldPeek = {
    originalValue,
    active,
    onToggle: () => setActive((a) => !a),
    tooltip: baseTooltip,
    emptyLabel: "(no content)",
  };
  return (
    <FormField
      id="exp-title"
      label="Title"
      type={type}
      value="Suggested text"
      onChange={() => {}}
      peek={peek}
    />
  );
}

describe("FormField peek", () => {
  it("renders no peek toggle when peek prop is not provided", () => {
    harness.render(
      <FormField id="f1" label="Field" value="hello" onChange={() => {}} />,
    );
    expect(harness.container.querySelector("svg.lucide-eye")).toBeNull();
    expect(harness.container.querySelector("svg.lucide-eye-off")).toBeNull();
  });

  it("renders an EyeOff toggle by default showing the admin's suggestion", () => {
    harness.render(<PeekHarness />);
    const input = harness.container.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("Suggested text");
    expect(harness.container.querySelector("svg.lucide-eye-off")).not.toBeNull();
    expect(harness.container.querySelector("svg.lucide-eye")).toBeNull();
    expect(harness.container.textContent ?? "").toContain(
      "Click to see original content",
    );
  });

  it("toggling swaps the displayed value to the original with line-through, then reverts", () => {
    harness.render(<PeekHarness />);
    const button = harness.container.querySelector('[role="button"]') as HTMLElement;
    harness.click(button);

    let input = harness.container.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("Original text");
    expect(input.className).toContain("line-through");
    expect(harness.container.querySelector("svg.lucide-eye")).not.toBeNull();
    expect(harness.container.querySelector("svg.lucide-eye-off")).toBeNull();
    expect(harness.container.textContent ?? "").toContain(
      "Click to see admin's suggestion",
    );

    harness.click(button);
    input = harness.container.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("Suggested text");
    expect(input.className).not.toContain("line-through");
    expect(harness.container.querySelector("svg.lucide-eye-off")).not.toBeNull();
  });

  it("shows a muted italic placeholder when the original value is empty", () => {
    harness.render(<PeekHarness originalValue="" />);
    const button = harness.container.querySelector('[role="button"]') as HTMLElement;
    harness.click(button);

    const input = harness.container.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("");
    expect(input.placeholder).toBe("(no content)");
    expect(input.className).toContain("italic");
    expect(input.className).not.toContain("line-through");
  });

  it("does not render a peek toggle for password fields even when peek is provided", () => {
    harness.render(<PeekHarness type="password" />);
    const buttons = harness.container.querySelectorAll("button");
    expect(buttons.length).toBe(1);
    // Only the password visibility toggle is present (Eye, since hidden by default).
    expect(harness.container.querySelector("svg.lucide-eye")).not.toBeNull();
    expect(harness.container.querySelector("svg.lucide-eye-off")).toBeNull();
  });
});
