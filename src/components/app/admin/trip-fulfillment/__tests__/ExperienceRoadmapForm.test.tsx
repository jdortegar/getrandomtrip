import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { ExperienceRoadmapDocument } from "@/lib/types/ExperienceRoadmap";
import { ExperienceRoadmapForm } from "../ExperienceRoadmapForm";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const initial: ExperienceRoadmapDocument = {
  template: "experience-roadmap",
  templateVersion: 1,
  label: "Ruta",
  country: "AR",
  locale: "es",
  data: {
    origin: "Buenos Aires",
    destination: "Areco",
    startDate: "2026-10-02",
    endDate: "2026-10-03",
    duration: "2 horas",
    heading: "Río y café",
    activities: [
      { id: "walk", title: "Paseo", description: "Caminar por la ribera" },
    ],
  },
};
let root: Root;
let container: HTMLDivElement;
const submit = vi.fn();
function Harness({ dictionary = en, busy = false, value = initial }) {
  const [document, setDocument] = useState(value);
  return (
    <ExperienceRoadmapForm
      copy={dictionary.hotelVoucherForm}
      countryLabels={{ AR: "Argentina" }}
      onChange={setDocument}
      onSubmit={submit}
      pdfCopy={dictionary.hotelVoucherPdf}
      roadmapCopy={dictionary.experienceRoadmapPdf}
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
  "renders localized field labels and preserves authored activities",
  (dictionary) => {
    act(() => root.render(<Harness dictionary={dictionary} />));
    expect(
      container.querySelector('label[for="experience-origin"]')?.textContent,
    ).toBe(dictionary.experienceRoadmapPdf.origin);
    edit("experience-origin", "Rosario");
    edit("experience-duration", "3 horas");
    edit("experience-heading", "Un día tranquilo");
    edit("experience-mapUrl", "https://example.com/map");
    send();
    expect(submit.mock.calls[0][0].data).toMatchObject({
      origin: "Rosario",
      duration: "3 horas",
      heading: "Un día tranquilo",
      mapUrl: "https://example.com/map",
      activities: initial.data.activities,
    });
  },
);
it("edits locale, label, destination and date range", () => {
  act(() => root.render(<Harness />));
  edit("experience-locale", "en");
  edit("experience-label", "Roadmap");
  edit("experience-destination", "Tigre");
  edit("experience-endDate", "2026-10-04");
  send();
  expect(submit.mock.calls[0][0]).toMatchObject({
    label: "Roadmap",
    locale: "en",
    data: { destination: "Tigre", endDate: "2026-10-04" },
  });
});
it.each([
  ["experience-origin", ""],
  ["experience-endDate", "2026-01-01"],
  ["experience-mapUrl", "http://unsafe"],
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
    container.querySelector<HTMLInputElement>("#experience-mapUrl")!.value,
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
