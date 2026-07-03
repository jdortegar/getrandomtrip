import { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RichTextInput } from "../RichTextInput";
import type { FieldPeek } from "../field-peek";
import { createDomHarness, type DomHarness } from "./test-dom-utils";

// TinyMCE needs a real browser + loaded script to initialize; irrelevant to
// peek logic, which is tested via the static preview branch that never
// mounts the editor. A minimal stand-in keeps these tests fast and hermetic.
vi.mock("@tinymce/tinymce-react", () => ({
  Editor: ({ value, onEditorChange }: { value: string; onEditorChange: (html: string) => void }) => (
    <textarea data-testid="mock-editor" value={value} onChange={(e) => onEditorChange(e.target.value)} readOnly />
  ),
}));

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
  originalValue = "<p>Original text</p>",
  onChange = () => {},
}: {
  originalValue?: string;
  onChange?: (html: string) => void;
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
    <RichTextInput
      id="act-desc-0"
      label="Description"
      value="<p>Suggested text</p>"
      onChange={onChange}
      peek={peek}
    />
  );
}

describe("RichTextInput peek", () => {
  it("renders no peek toggle when peek prop is not provided, editor mounted", () => {
    harness.render(
      <RichTextInput id="d1" label="Field" value="<p>hello</p>" onChange={() => {}} />,
    );
    expect(harness.container.querySelector("svg.lucide-eye")).toBeNull();
    expect(harness.container.querySelector("svg.lucide-eye-off")).toBeNull();
    expect(harness.container.querySelector('[data-testid="mock-editor"]')).not.toBeNull();
  });

  it("renders an EyeOff toggle by default, editor shows the admin's suggestion", () => {
    harness.render(<PeekHarness />);
    const editor = harness.container.querySelector('[data-testid="mock-editor"]') as HTMLTextAreaElement;
    expect(editor.value).toBe("<p>Suggested text</p>");
    expect(harness.container.querySelector("svg.lucide-eye-off")).not.toBeNull();
    expect(harness.container.querySelector("svg.lucide-eye")).toBeNull();
  });

  it("toggling swaps to a static struck-through preview of the original, without touching the live editor", () => {
    const onChange = vi.fn();
    harness.render(<PeekHarness onChange={onChange} />);
    const button = harness.container.querySelector('[role="button"]') as HTMLElement;
    harness.click(button);

    // The editor unmounts entirely while peeking — no controlled-value swap,
    // so TinyMCE's own change-detection can never fire onChange from a peek.
    expect(harness.container.querySelector('[data-testid="mock-editor"]')).toBeNull();
    expect(harness.container.textContent ?? "").toContain("Original text");
    const preview = harness.container.querySelector(".line-through");
    expect(preview).not.toBeNull();
    expect(harness.container.querySelector("svg.lucide-eye")).not.toBeNull();
    expect(harness.container.querySelector("svg.lucide-eye-off")).toBeNull();

    // Regression guard: toggling the peek must never call the real onChange,
    // since that would overwrite the admin's edit with the original value.
    expect(onChange).not.toHaveBeenCalled();

    harness.click(button);
    expect(harness.container.querySelector('[data-testid="mock-editor"]')).not.toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows a muted italic placeholder when the original value is empty", () => {
    harness.render(<PeekHarness originalValue="" />);
    const button = harness.container.querySelector('[role="button"]') as HTMLElement;
    harness.click(button);

    expect(harness.container.textContent ?? "").toContain("(no content)");
    expect(harness.container.querySelector(".italic")).not.toBeNull();
    expect(harness.container.querySelector(".line-through")).toBeNull();
  });
});
