import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { XsedRoadmapDocument } from "@/lib/types/XsedRoadmap";
import { XsedRoadmapForm } from "../XsedRoadmapForm";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const initial: XsedRoadmapDocument = {
  template: "xsed-roadmap",
  templateVersion: 1,
  label: "Ruta",
  country: "AR",
  locale: "es",
  data: {
    origin: "Buenos Aires",
    destination: "Areco",
    departureDate: "2026-10-02",
    departureTime: "09:00",
    drivingDuration: "2 horas",
    stops: [
      { id: "walk", title: "Paseo", directions: "Caminar por la ribera" },
    ],
  },
};
let root: Root;
let container: HTMLDivElement;
const submit = vi.fn();
function Harness({ dictionary = en, busy = false, value = initial }) {
  const [document, setDocument] = useState(value);
  return (
    <XsedRoadmapForm
      copy={dictionary.hotelVoucherForm}
      countryLabels={{ AR: "Argentina" }}
      onChange={setDocument}
      onSubmit={submit}
      pdfCopy={dictionary.hotelVoucherPdf}
      roadmapCopy={dictionary.xsedRoadmapPdf}
      submitting={busy}
      value={document}
    />
  );
}
function edit(id: string, value: string) {
  const field = container.querySelector<HTMLInputElement>(`#${id}`)!;
  act(() => {
    Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(field),
      "value",
    )!.set!.call(field, value);
    field.dispatchEvent(
      new Event(field.tagName === "SELECT" ? "change" : "input", {
        bubbles: true,
      }),
    );
  });
}
function send() {
  act(() =>
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
}
beforeEach(() => {
  submit.mockReset();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
it.each([en, es])(
  "renders localized field labels and preserves authored stops",
  (dictionary) => {
    act(() => root.render(<Harness dictionary={dictionary} />));
    expect(
      container.querySelector('label[for="xsed-origin"]')?.textContent,
    ).toBe(dictionary.xsedRoadmapPdf.origin);
    edit("xsed-origin", "Rosario");
    edit("xsed-drivingDuration", "3 horas");
    edit("xsed-mapUrl", "https://example.com/map");
    send();
    expect(submit.mock.calls[0][0].data).toMatchObject({
      origin: "Rosario",
      drivingDuration: "3 horas",
      mapUrl: "https://example.com/map",
      stops: initial.data.stops,
    });
  },
);
it("edits locale, label, destination and date range", () => {
  act(() => root.render(<Harness />));
  edit("xsed-locale", "en");
  edit("xsed-label", "Roadmap");
  edit("xsed-destination", "Tigre");
  edit("xsed-departureTime", "10:30");
  send();
  expect(submit.mock.calls[0][0]).toMatchObject({
    label: "Roadmap",
    locale: "en",
    data: { destination: "Tigre", departureTime: "10:30" },
  });
});
it.each([
  ["xsed-origin", ""],
  ["xsed-departureTime", ""],
  ["xsed-mapUrl", "http://unsafe"],
])("rejects invalid %s", (id, value) => {
  act(() => root.render(<Harness />));
  edit(id, value);
  send();
  expect(submit).not.toHaveBeenCalled();
  expect(container.querySelector('[role="alert"]')?.textContent).toBe(
    en.hotelVoucherForm.invalid,
  );
});
it("allows omitted map and does not invent a route", () => {
  act(() => root.render(<Harness />));
  expect(
    container.querySelector<HTMLInputElement>("#xsed-mapUrl")!.value,
  ).toBe("");
  send();
  expect(submit.mock.calls[0][0].data.mapUrl).toBeUndefined();
});
it("blocks submission while preview is busy", () => {
  act(() => root.render(<Harness busy />));
  send();
  expect(submit).not.toHaveBeenCalled();
  expect(container.querySelector("fieldset")!.disabled).toBe(true);
});
