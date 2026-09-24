import { act, useState, type ReactNode } from "react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { MultiSelectInput } from "../MultiSelectInput";
import { createDomHarness, type DomHarness } from "./test-dom-utils";

let harness: DomHarness;
const options = [
  { value: "a", label: "Argentina" },
  { value: "b", label: "Brazil" },
];
function Example({
  label = "Destinations",
  initialValue = [],
}: {
  label?: ReactNode;
  initialValue?: string[];
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <MultiSelectInput
        label={label}
        onChange={setValue}
        options={options}
        placeholder="Choose destinations"
        searchPlaceholder="Search destinations"
        value={value}
      />
      <output>{value.join(",")}</output>
    </>
  );
}
function trigger() {
  return harness.container.querySelector<HTMLElement>('[role="combobox"]')!;
}
function dialog() {
  return document.querySelector<HTMLElement>('[role="dialog"]')!;
}
async function settle() {
  // Radix defers close-autofocus until its focus scope is removed.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}
function press(element: HTMLElement, key: string) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  act(() => element.dispatchEvent(event));
  return event;
}
beforeEach(() => {
  harness = createDomHarness();
});
afterEach(async () => {
  harness.unmount();
  await settle();
});

it("click-toggles the real Radix dialog with a matching control relationship", async () => {
  harness.render(<Example />);
  const control = trigger();
  expect(control.getAttribute("aria-expanded")).toBe("false");
  harness.click(control);
  await settle();
  expect(control.getAttribute("aria-haspopup")).toBe("dialog");
  expect(control.getAttribute("aria-controls")).toBe(dialog().id);
  expect(control.getAttribute("aria-expanded")).toBe("true");
  expect(dialog().querySelectorAll('[role="option"]')).toHaveLength(2);
  harness.click(control);
  await settle();
  expect(control.getAttribute("aria-expanded")).toBe("false");
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});

it("keeps selection toggling and tag removal independent of popup opening", async () => {
  harness.render(<Example />);
  harness.click(trigger());
  await settle();
  harness.click(dialog().querySelector('[role="option"]')!);
  expect(harness.container.querySelector("output")?.textContent).toBe("a");
  harness.click(dialog().querySelector('[role="option"]')!);
  expect(harness.container.querySelector("output")?.textContent).toBe("");
  harness.click(dialog().querySelector('[role="option"]')!);
  harness.click(trigger());
  await settle();
  harness.click(trigger().querySelector("button")!);
  expect(harness.container.querySelector("output")?.textContent).toBe("");
  expect(trigger().getAttribute("aria-expanded")).toBe("false");
});

it.each(["Enter", " "])(
  "opens with focused %j and restores trigger focus on Escape",
  async (key) => {
    harness.render(<Example />);
    const control = trigger();
    act(() => control.focus());
    expect(document.activeElement).toBe(control);
    expect(press(control, key).defaultPrevented).toBe(true);
    await settle();
    expect(control.getAttribute("aria-expanded")).toBe("true");
    const input = dialog().querySelector("input")!;
    expect(document.activeElement).toBe(input);
    press(input, "Escape");
    await settle();
    expect(control.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(control);
  },
);

function labelText(element: Element) {
  return (element.getAttribute("aria-labelledby") ?? "")
    .split(" ")
    .map((id) => document.getElementById(id)?.textContent ?? "")
    .join("");
}

it("programmatically names the trigger from its visible React-node label", () => {
  harness.render(<Example label={<span>Preferred destinations</span>} />);
  expect(labelText(trigger())).toBe("Preferred destinations");
});

it("labels the focused search and relates its active option to the real listbox", async () => {
  harness.render(<Example />);
  harness.click(trigger());
  await settle();
  const input = dialog().querySelector("input")!;
  expect(labelText(input)).toBe("Search destinations");
  expect(input.getAttribute("role")).toBe("combobox");
  expect(input.getAttribute("aria-controls")).toBe(
    dialog().querySelector('[role="listbox"]')!.id,
  );
  press(input, "ArrowDown");
  const active = document.getElementById(
    input.getAttribute("aria-activedescendant")!,
  );
  expect(active?.textContent).toBe("Brazil");
  press(input, "Enter");
  expect(harness.container.querySelector("output")?.textContent).toBe("b");
});

it("keeps unique stable controls for two instances and names their respective dialogs", async () => {
  harness.render(
    <>
      <Example label="First" />
      <Example label="Second" />
    </>,
  );
  const controls = Array.from(
    harness.container.querySelectorAll<HTMLElement>('[role="combobox"]'),
  );
  expect(controls).toHaveLength(2);
  const ids = controls.map((control) => control.getAttribute("aria-controls"));
  expect(new Set(ids).size).toBe(2);
  for (const [index, name] of ["First", "Second"].entries()) {
    harness.click(controls[index]);
    await settle();
    expect(dialog().id).toBe(ids[index]);
    expect(labelText(dialog())).toBe(name);
    harness.click(controls[index]);
    await settle();
    expect(controls[index].getAttribute("aria-controls")).toBe(ids[index]);
  }
});

it("uses existing placeholder copy as a name when no label is supplied", async () => {
  harness.render(<Example initialValue={["a"]} label={null} />);
  expect(trigger().getAttribute("aria-label")).toBe("Choose destinations");
  harness.click(trigger());
  await settle();
  expect(dialog().getAttribute("aria-label")).toBe("Choose destinations");
});

it.each(["Enter", " "])(
  "does not intercept nested remove-button %j or open the popup on removal",
  (key) => {
    harness.render(<Example initialValue={["a"]} />);
    const remove = trigger().querySelector("button")!;
    act(() => remove.focus());
    expect(document.activeElement).toBe(remove);
    expect(press(remove, key).defaultPrevented).toBe(false);
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    // Synthetic key dispatch has no browser button default action; exercise click separately.
    harness.click(remove);
    expect(harness.container.querySelector("output")?.textContent).toBe("");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
  },
);

it("preserves filtering, empty results and keyboard selection through the labeled search", async () => {
  harness.render(<Example />);
  harness.click(trigger());
  await settle();
  const input = dialog().querySelector("input")!;
  function search(value: string) {
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  search("bRa");
  expect(
    Array.from(dialog().querySelectorAll('[role="option"]')).map(
      (option) => option.textContent,
    ),
  ).toEqual(["Brazil"]);
  press(input, "Enter");
  expect(harness.container.querySelector("output")?.textContent).toBe("b");
  search("unknown");
  expect(dialog().querySelectorAll('[role="option"]')).toHaveLength(0);
  expect(dialog().textContent).toContain("No results.");
  search("");
  expect(dialog().querySelectorAll('[role="option"]')).toHaveLength(2);
});
