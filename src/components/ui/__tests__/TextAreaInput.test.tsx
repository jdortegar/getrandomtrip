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

function PeekHarness({
  originalValue = "Original description",
}: {
  originalValue?: string;
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
    <TextAreaInput
      id="exp-description"
      label="Description"
      value="Suggested description"
      onChange={() => {}}
      peek={peek}
    />
  );
}

describe("TextAreaInput labeling", () => {
  it("associates the visible label with the textarea", () => {
    harness.render(
      <TextAreaInput id="d1" label="Field" onChange={() => {}} value="" />,
    );
    const textarea = harness.container.querySelector(
      "textarea",
    ) as HTMLTextAreaElement;
    expect(textarea.labels?.[0]?.textContent).toBe("Field");
  });
});

describe("TextAreaInput peek", () => {
  it("renders no peek toggle when peek prop is not provided", () => {
    harness.render(
      <TextAreaInput id="d1" label="Field" value="hello" onChange={() => {}} />,
    );
    expect(harness.container.querySelector('[role="button"]')).toBeNull();
  });

  it("offers the original-content action while displaying the suggestion and its count", () => {
    harness.render(<PeekHarness />);
    const textarea = harness.container.querySelector(
      "textarea",
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Suggested description");
    expect(
      harness.container
        .querySelector('[role="button"]')
        ?.getAttribute("aria-label"),
    ).toBe(baseTooltip.showOriginal);
    expect(harness.container.textContent ?? "").toContain(
      `${"Suggested description".length} /`,
    );
  });

  it("toggling swaps values, accessible actions and character counts", () => {
    harness.render(<PeekHarness />);
    const button = harness.container.querySelector(
      '[role="button"]',
    ) as HTMLElement;
    harness.click(button);

    const textarea = harness.container.querySelector(
      "textarea",
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Original description");
    expect(button.getAttribute("aria-label")).toBe(baseTooltip.showSuggestion);
    expect(harness.container.textContent ?? "").toContain(
      `${"Original description".length} /`,
    );
    harness.click(button);
    expect(textarea.value).toBe("Suggested description");
    expect(button.getAttribute("aria-label")).toBe(baseTooltip.showOriginal);
  });

  it("shows the empty-original placeholder and zero count", () => {
    harness.render(<PeekHarness originalValue="" />);
    const button = harness.container.querySelector(
      '[role="button"]',
    ) as HTMLElement;
    harness.click(button);

    const textarea = harness.container.querySelector(
      "textarea",
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe("");
    expect(textarea.placeholder).toBe("(no content)");
    expect(harness.container.textContent).toContain("0 / 280");
    expect(button.getAttribute("aria-label")).toBe(baseTooltip.showSuggestion);
  });
});
