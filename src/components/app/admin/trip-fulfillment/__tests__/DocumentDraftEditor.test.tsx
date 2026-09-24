import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { createTripDocumentSnapshot } from "@/lib/trip-documents/snapshots";
import { DocumentDraftEditor } from "../DocumentDraftEditor";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let host: HTMLDivElement;
const save = vi.fn();
const preview = vi.fn();
const close = vi.fn();
function Harness({
  template = "hotel-voucher" as Parameters<
    typeof createTripDocumentSnapshot
  >[0],
  busy = false,
  dictionary = en,
}) {
  const initial = createTripDocumentSnapshot(template, {});
  const [value, setValue] = useState(initial);
  return (
    <DocumentDraftEditor
      busy={busy}
      countryLabels={{ AR: "Argentina" }}
      dictionary={dictionary}
      dirty={JSON.stringify(value) !== JSON.stringify(initial)}
      onChange={setValue}
      onClose={close}
      onPreview={preview}
      onSave={() => save(value)}
      value={value}
    />
  );
}
function button(label: string) {
  return [...host.querySelectorAll("button")].find(
    (node) => node.textContent === label,
  )!;
}
beforeEach(() => {
  save.mockReset();
  preview.mockReset();
  close.mockReset();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});
it.each([
  "hotel-voucher",
  "activity-voucher",
  "dinner-voucher",
  "experience-roadmap",
  "xsed-roadmap",
] as const)(
  "saves incomplete %s independently of generation validation",
  (template) => {
    act(() => root.render(<Harness template={template} />));
    act(() => button(en.documentDraftEditor.save).click());
    expect(save).toHaveBeenCalledOnce();
    expect(save.mock.calls[0][0].template).toBe(template);
    act(() =>
      host
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(preview).not.toHaveBeenCalled();
    expect(host.querySelector('[role="alert"]')).not.toBe(null);
  },
);
it.each([en, es])("uses localized draft actions and notices", (dictionary) => {
  act(() => root.render(<Harness dictionary={dictionary} />));
  expect(host.textContent).toContain(dictionary.documentDraftEditor.note);
  expect(button(dictionary.documentDraftEditor.save).getAttribute("type")).toBe(
    "button",
  );
});
it("guards dirty close and unload without resetting controlled edits", () => {
  act(() => root.render(<Harness />));
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  const input = host.querySelector<HTMLInputElement>("input")!;
  act(() => {
    Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(input),
      "value",
    )!.set!.call(input, "Edited");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const unload = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(unload);
  expect(unload.defaultPrevented).toBe(true);
  act(() => button(en.documentDraftEditor.close).click());
  expect(close).not.toHaveBeenCalled();
  expect(input.value).toBe("Edited");
  confirm.mockReturnValue(true);
  act(() => button(en.documentDraftEditor.close).click());
  expect(close).toHaveBeenCalledOnce();
  act(() => root.unmount());
  const clean = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(clean);
  expect(clean.defaultPrevented).toBe(false);
  root = createRoot(host);
});
it("disables draft save and form edits while busy", () => {
  act(() => root.render(<Harness busy />));
  expect(button(en.documentDraftEditor.save).disabled).toBe(true);
  act(() => button(en.documentDraftEditor.save).click());
  expect(save).not.toHaveBeenCalled();
  expect(host.querySelector("fieldset")!.disabled).toBe(true);
});

it.each([
  "hotel-voucher",
  "activity-voucher",
  "dinner-voucher",
  "experience-roadmap",
  "xsed-roadmap",
] as const)(
  "identifies and focuses invalid %s fields in Spanish, clearing corrected fields",
  (template) => {
    act(() => root.render(<Harness dictionary={es} template={template} />));
    act(() =>
      host
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    const label = host.querySelector<HTMLInputElement>('input[name="label"]')!;
    expect(label?.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(label);
    const errorId = label.getAttribute("aria-describedby")!;
    expect(document.getElementById(errorId)?.textContent).toBe(
      "Completa este campo.",
    );
    act(() => {
      Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(label),
        "value",
      )!.set!.call(label, "Documento");
      label.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(label.hasAttribute("aria-invalid")).toBe(false);
    expect(document.getElementById(errorId)).toBeNull();
    expect(
      host
        .querySelector('select[name="country"]')
        ?.getAttribute("aria-invalid"),
    ).toBe("true");
    expect(preview).not.toHaveBeenCalled();
    act(() => button(es.documentDraftEditor.save).click());
    expect(save).toHaveBeenCalledOnce();
  },
);

it("shows nested required errors after adding a stop and identifies an empty required group", () => {
  act(() => root.render(<Harness dictionary={es} template="xsed-roadmap" />));
  act(() =>
    host
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  const group = host.querySelector('[name="data.stops"]')!;
  expect(group?.getAttribute("aria-invalid")).toBe("true");
  expect(
    document.getElementById(group.getAttribute("aria-describedby")!)
      ?.textContent,
  ).toBe("Completa este campo.");
  act(() =>
    (host.querySelector("[data-add-stop]") as HTMLButtonElement).click(),
  );
  expect(group.hasAttribute("aria-invalid")).toBe(false);
  for (const field of ["title", "directions"]) {
    const control = host.querySelector(`[name="data.stops.0.${field}"]`)!;
    expect(control?.getAttribute("aria-invalid")).toBe("true");
    expect(
      document.getElementById(control.getAttribute("aria-describedby")!)
        ?.textContent,
    ).toBe("Completa este campo.");
  }
});
