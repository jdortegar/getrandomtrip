import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { ActivityVoucherDocument } from "@/lib/types/ActivityVoucher";
import { ActivityVoucherForm } from "../ActivityVoucherForm";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
const submit = vi.fn();
const initial: ActivityVoucherDocument = {
  template: "activity-voucher",
  templateVersion: 1,
  label: "Hotel",
  locale: "en",
  country: "AR",
  data: {
    holder: "Ana",
    participants: "Ana",
    date: "2026-10-01",
    time: "10:00",
    provider: { name: "Río", address: "Calle 1" },
    program: [{ id: "spa", title: "Spa" }],
    inclusions: [],
  },
};
function Harness({ dictionary = en, value = initial, busy = false }) {
  const [document, setDocument] = useState(value);
  return (
    <ActivityVoucherForm
      activityCopy={dictionary.activityVoucherPdf}
      copy={dictionary.hotelVoucherForm}
      countryLabels={{ AR: "Argentina" }}
      onChange={setDocument}
      onSubmit={submit}
      pdfCopy={dictionary.hotelVoucherPdf}
      submitting={busy}
      value={document}
    />
  );
}
function edit(id: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(`#${id}`)!;
  act(() => {
    Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(input),
      "value",
    )!.set!.call(input, value);
    input.dispatchEvent(
      new Event(input.tagName === "SELECT" ? "change" : "input", {
        bubbles: true,
      }),
    );
  });
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
  "labels fields accessibly and preserves authored claims",
  (dictionary) => {
    act(() => root.render(<Harness dictionary={dictionary} />));
    expect(
      container.querySelector('label[for="activity-holder"]')?.textContent,
    ).toBe(dictionary.hotelVoucherPdf.holder);
    expect(
      container.querySelector<HTMLInputElement>("#activity-paymentWording")!
        .value,
    ).toBe("");
    edit("activity-holder", "José");
    edit("activity-paymentWording", "Pay at venue");
    act(() =>
      container
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(submit.mock.calls[0][0].data).toMatchObject({
      holder: "José",
      paymentWording: "Pay at venue",
    });
  },
);
it("edits metadata, provider and dates without losing sibling values", () => {
  act(() => root.render(<Harness />));
  edit("activity-locale", "es");
  edit("activity-provider-address", "Calle Nueva");
  edit("activity-date", "2026-10-05");
  edit("activity-time", "14:30");
  edit("activity-recommendations", "Bring identification");
  act(() =>
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(submit.mock.calls[0][0]).toMatchObject({
    locale: "es",
    data: {
      date: "2026-10-05",
      time: "14:30",
      recommendations: "Bring identification",
      program: [{ id: "spa", title: "Spa" }],
      provider: { name: "Río", address: "Calle Nueva" },
    },
  });
});
it("blocks invalid required fields and invalid dates", () => {
  act(() => root.render(<Harness />));
  edit("activity-participants", "");
  edit("activity-date", "2026-02-30");
  act(() =>
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(submit).not.toHaveBeenCalled();
  expect(container.querySelector("[role=alert]")?.textContent).toBe(
    en.hotelVoucherForm.invalid,
  );
});
it("disables editing and submission while preview is pending", () => {
  act(() => root.render(<Harness busy />));
  expect(container.querySelector("fieldset")!.disabled).toBe(true);
  act(() =>
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(submit).not.toHaveBeenCalled();
});
it("retains existing inclusions during scalar edits and rejects unsafe links", () => {
  const value = {
    ...initial,
    data: { ...initial.data, inclusions: [{ id: "meal", title: "Breakfast" }] },
  };
  act(() => root.render(<Harness value={value} />));
  edit("activity-provider-locationUrl", "http://unsafe.example");
  act(() =>
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(submit).not.toHaveBeenCalled();
  edit("activity-provider-locationUrl", "https://example.com/map");
  act(() =>
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(submit.mock.calls[0][0].data.inclusions).toEqual([
    { id: "meal", title: "Breakfast" },
  ]);
});
it.each([en, es])(
  "labels the activity provider URL rather than a hotel property",
  (dictionary) => {
    act(() => root.render(<Harness dictionary={dictionary} />));
    expect(
      container.querySelector('label[for="activity-provider-providerUrl"]')
        ?.textContent,
    ).toBe(dictionary.activityVoucherPdf.provider);
  },
);
