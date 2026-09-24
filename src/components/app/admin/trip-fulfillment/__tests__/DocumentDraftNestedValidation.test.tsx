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
  ["hotel-voucher", "inclusions", "button", es.hotelVoucherForm.add],
  ["activity-voucher", "program", '[data-item-section="program"] [data-add]'],
  [
    "activity-voucher",
    "inclusions",
    '[data-item-section="inclusions"] [data-add]',
  ],
  ["dinner-voucher", "menuItems", "[data-add-menu]"],
  ["experience-roadmap", "activities", "[data-add-stop]"],
  ["xsed-roadmap", "stops", "[data-add-stop]"],
] as const)(
  "maps %s %s item errors to parser paths",
  (template, array, selector, label) => {
    act(() => root.render(<Harness dictionary={es} template={template} />));
    act(() =>
      (label
        ? button(label)
        : host.querySelector<HTMLButtonElement>(selector)!
      ).click(),
    );
    act(() =>
      host
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    const title = host.querySelector(`[name="data.${array}.0.title"]`)!;
    expect(title?.getAttribute("aria-invalid")).toBe("true");
    expect(
      document.getElementById(title.getAttribute("aria-describedby")!)
        ?.textContent,
    ).toBe(es.hotelVoucherForm.errors.required);
  },
);
