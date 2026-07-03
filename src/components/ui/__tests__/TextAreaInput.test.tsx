import { useState } from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TextAreaInput } from "../TextAreaInput";
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

function PeekHarness({ originalValue = "Original description" }: { originalValue?: string }) {
  const [active, setActive] = useState(false);
  const peek: FieldPeek = {
    originalValue,
    active,
    onToggle: () => setActive((a) => !a),
    tooltip: baseTooltip,
    emptyLabel: "(no content)",
  };
  return (
    <TextAreaInput
      id="exp-description"
      label="Description"
      value="Suggested description"
      onChange={() => {}}
      peek={peek}
    />
  );
}

describe("TextAreaInput peek", () => {
  it("renders no peek toggle when peek prop is not provided", () => {
    harness.render(
      <TextAreaInput id="d1" label="Field" value="hello" onChange={() => {}} />,
    );
    expect(harness.container.querySelector("svg.lucide-eye")).toBeNull();
    expect(harness.container.querySelector("svg.lucide-eye-off")).toBeNull();
  });

  it("renders an EyeOff toggle by default showing the admin's suggestion, char count reflects displayed value", () => {
    harness.render(<PeekHarness />);
    const textarea = harness.container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Suggested description");
    expect(harness.container.querySelector("svg.lucide-eye-off")).not.toBeNull();
    expect(harness.container.textContent ?? "").toContain(
      `${"Suggested description".length} /`,
    );
  });

  it("toggling swaps the displayed value to the original with line-through and updates char count", () => {
    harness.render(<PeekHarness />);
    const button = harness.container.querySelector('[role="button"]') as HTMLElement;
    harness.click(button);

    const textarea = harness.container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Original description");
    expect(textarea.className).toContain("line-through");
    expect(harness.container.querySelector("svg.lucide-eye")).not.toBeNull();
    expect(harness.container.textContent ?? "").toContain(
      `${"Original description".length} /`,
    );
  });

  it("shows a muted italic placeholder when the original value is empty", () => {
    harness.render(<PeekHarness originalValue="" />);
    const button = harness.container.querySelector('[role="button"]') as HTMLElement;
    harness.click(button);

    const textarea = harness.container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea.value).toBe("");
    expect(textarea.placeholder).toBe("(no content)");
    expect(textarea.className).toContain("italic");
    expect(textarea.className).not.toContain("line-through");
  });
});
