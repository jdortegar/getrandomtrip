import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { HotelVoucherDocument } from "@/lib/types/HotelVoucher";
import { HotelVoucherForm } from "../HotelVoucherForm";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
const submit = vi.fn();
const initial: HotelVoucherDocument = {
  template: "hotel-voucher",
  templateVersion: 1,
  label: "Hotel",
  locale: "en",
  country: "AR",
  data: {
    holder: "Ana",
    guests: "Ana",
    checkInDate: "2026-10-01",
    checkOutDate: "2026-10-03",
    property: { name: "Río", address: "Calle 1" },
    inclusions: [],
  },
};
function Harness({ dictionary = en, value = initial, busy = false }) {
  const [document, setDocument] = useState(value);
  return (
    <HotelVoucherForm
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
      container.querySelector('label[for="hotel-holder"]')?.textContent,
    ).toBe(dictionary.hotelVoucherPdf.holder);
    expect(
      container.querySelector<HTMLInputElement>("#hotel-paymentWording")!.value,
    ).toBe("");
    edit("hotel-holder", "José");
    edit("hotel-paymentWording", "Pay at hotel");
    act(() =>
      container
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(submit.mock.calls[0][0].data).toMatchObject({
      holder: "José",
      paymentWording: "Pay at hotel",
    });
  },
);
it("edits metadata, provider and dates without losing sibling values", () => {
  act(() => root.render(<Harness />));
  edit("hotel-locale", "es");
  edit("hotel-property-address", "Calle Nueva");
  edit("hotel-checkOutDate", "2026-10-05");
  act(() =>
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(submit.mock.calls[0][0]).toMatchObject({
    locale: "es",
    data: {
      checkOutDate: "2026-10-05",
      property: { name: "Río", address: "Calle Nueva" },
    },
  });
});
it("blocks invalid required fields and reversed dates", () => {
  act(() => root.render(<Harness />));
  edit("hotel-holder", "");
  edit("hotel-checkOutDate", "2026-09-01");
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
  edit("hotel-property-locationUrl", "http://unsafe.example");
  act(() =>
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(submit).not.toHaveBeenCalled();
  edit("hotel-property-locationUrl", "https://example.com/map");
  act(() =>
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(submit.mock.calls[0][0].data.inclusions).toEqual([
    { id: "meal", title: "Breakfast" },
  ]);
});
