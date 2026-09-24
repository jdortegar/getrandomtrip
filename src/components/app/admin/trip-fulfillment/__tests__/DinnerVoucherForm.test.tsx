import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { DinnerVoucherDocument } from "@/lib/types/DinnerVoucher";
import { DinnerVoucherForm } from "../DinnerVoucherForm";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
const submit = vi.fn();
const initial: DinnerVoucherDocument = {
  template: "dinner-voucher",
  templateVersion: 1,
  label: "Hotel",
  locale: "en",
  country: "AR",
  data: {
    holder: "Ana",
    guests: "Ana",
    date: "2026-10-01",
    time: "20:30",
    service: "Cena de pasos",
    restaurant: { name: "Río", address: "Calle 1" },
    menuItems: [{ id: "spa", title: "Spa" }],
  },
};
function Harness({ dictionary = en, value = initial, busy = false }) {
  const [document, setDocument] = useState(value);
  return (
    <DinnerVoucherForm
      dinnerCopy={dictionary.dinnerVoucherPdf}
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
      container.querySelector('label[for="dinner-holder"]')?.textContent,
    ).toBe(dictionary.hotelVoucherPdf.holder);
    expect(
      container.querySelector<HTMLInputElement>("#dinner-paymentWording")!
        .value,
    ).toBe("");
    edit("dinner-holder", "José");
    edit("dinner-paymentWording", "Pay at venue");
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
  edit("dinner-locale", "es");
  edit("dinner-restaurant-address", "Calle Nueva");
  edit("dinner-date", "2026-10-05");
  edit("dinner-time", "14:30");
  edit("dinner-conditions", "Bring identification");
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
      conditions: "Bring identification",
      menuItems: [{ id: "spa", title: "Spa" }],
      restaurant: { name: "Río", address: "Calle Nueva" },
    },
  });
});
it("blocks invalid required fields and invalid dates", () => {
  act(() => root.render(<Harness />));
  edit("dinner-guests", "");
  edit("dinner-date", "2026-02-30");
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
it("retains existing menu entries during scalar edits and rejects unsafe links", () => {
  const value = {
    ...initial,
    data: { ...initial.data, menuItems: [{ id: "meal", title: "Breakfast" }] },
  };
  act(() => root.render(<Harness value={value} />));
  edit("dinner-restaurant-locationUrl", "http://unsafe.example");
  act(() =>
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(submit).not.toHaveBeenCalled();
  edit("dinner-restaurant-locationUrl", "https://example.com/map");
  act(() =>
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(submit.mock.calls[0][0].data.menuItems).toEqual([
    { id: "meal", title: "Breakfast" },
  ]);
});
it.each([en, es])(
  "labels the activity provider URL rather than a hotel property",
  (dictionary) => {
    act(() => root.render(<Harness dictionary={dictionary} />));
    expect(
      container.querySelector('label[for="dinner-restaurant-providerUrl"]')
        ?.textContent,
    ).toBe(dictionary.dinnerVoucherPdf.provider);
  },
);
it("requires service wording but permits an empty menu", () => {
  act(() =>
    root.render(
      <Harness
        value={{ ...initial, data: { ...initial.data, menuItems: [] } }}
      />,
    ),
  );
  const send = () =>
    act(() =>
      container
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
  edit("dinner-service", "");
  send();
  expect(submit).not.toHaveBeenCalled();
  edit("dinner-service", "Cena a la carta");
  send();
  expect(submit.mock.calls[0][0].data).toMatchObject({
    service: "Cena a la carta",
    menuItems: [],
  });
});
it.each([
  [en, "Diners"],
  [es, "Comensales"],
] as const)("uses dining-specific guest terminology", (dictionary, label) => {
  act(() => root.render(<Harness dictionary={dictionary} />));
  expect(
    container.querySelector('label[for="dinner-guests"]')?.textContent,
  ).toBe(label);
});
const menuRows = () => [
  ...container.querySelectorAll<HTMLInputElement>("input[data-menu-title]"),
];
const menuButton = (attribute: string, index = 0) =>
  container.querySelectorAll<HTMLButtonElement>(`button[${attribute}]`)[index];
it("adds, edits, reorders and removes menu entries with stable identities", () => {
  act(() => root.render(<Harness />));
  act(() => menuButton("data-add-menu").click());
  const added = menuRows()[1];
  edit(added.id, "Postre");
  edit(
    container.querySelectorAll<HTMLTextAreaElement>(
      "textarea[data-menu-description]",
    )[1].id,
    "Flan casero",
  );
  act(() => menuButton("data-menu-up", 1).click());
  expect(menuRows()[0].id).toBe(added.id);
  expect(menuRows()[0].value).toBe("Postre");
  expect(
    container.querySelector<HTMLTextAreaElement>(
      "textarea[data-menu-description]",
    )!.value,
  ).toBe("Flan casero");
  act(() => menuButton("data-menu-remove", 1).click());
  expect(menuRows()).toHaveLength(1);
  act(() =>
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(submit.mock.calls[0][0].data).toMatchObject({
    service: "Cena de pasos",
    menuItems: [{ title: "Postre", description: "Flan casero" }],
  });
});
it("caps menu at50, permits removal to empty, and preserves unrelated data", () => {
  const items = Array.from({ length: 50 }, (_, i) => ({
    id: `saved-${i}`,
    title: `Dish ${i}`,
  }));
  act(() =>
    root.render(
      <Harness
        value={{ ...initial, data: { ...initial.data, menuItems: items } }}
      />,
    ),
  );
  expect(menuButton("data-add-menu").disabled).toBe(true);
  act(() => menuButton("data-menu-remove").click());
  expect(menuButton("data-add-menu").disabled).toBe(false);
  act(() => menuButton("data-add-menu").click());
  expect(new Set(menuRows().map((row) => row.id)).size).toBe(50);
  for (let i = 0; i < 50; i++)
    act(() => menuButton("data-menu-remove").click());
  expect(menuRows()).toHaveLength(0);
  act(() =>
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(submit.mock.calls[0][0].data).toMatchObject({
    service: "Cena de pasos",
    menuItems: [],
  });
});
it("does not edit menu while a preview is busy", () => {
  act(() => root.render(<Harness busy />));
  act(() => menuButton("data-add-menu").click());
  expect(menuRows()).toHaveLength(1);
});
