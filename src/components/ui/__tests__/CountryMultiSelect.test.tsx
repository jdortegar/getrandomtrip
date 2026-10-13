import { act, useState } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CountryMultiSelect } from "../CountryMultiSelect";
import type { CountryOption } from "@/lib/geo/countryOptions";
import { createDomHarness, type DomHarness } from "./test-dom-utils";

let harness: DomHarness;

function Example({
  initialValue = [],
  locale = "es",
  onChange,
  readOnly,
  error,
  extraOptions,
}: {
  initialValue?: string[];
  locale?: string;
  onChange?: (codes: string[]) => void;
  readOnly?: boolean;
  error?: string;
  extraOptions?: readonly CountryOption[];
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <CountryMultiSelect
        emptyLabel="None"
        error={error}
        extraOptions={extraOptions}
        label="Nationalities"
        locale={locale}
        noResultsLabel="No countries"
        onChange={(codes) => {
          setValue(codes);
          onChange?.(codes);
        }}
        placeholder="Choose countries"
        readOnly={readOnly}
        searchPlaceholder="Search countries"
        value={value}
      />
      <output>{value.join(",")}</output>
    </>
  );
}

const trigger = () =>
  harness.container.querySelector<HTMLElement>('[role="combobox"]')!;
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
const output = () => harness.container.querySelector("output")?.textContent;
const optionLabels = () =>
  Array.from(dialog().querySelectorAll('[role="option"]')).map(
    (option) => option.textContent,
  );

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function search(value: string) {
  const input = dialog().querySelector("input")!;
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
      input,
      value,
    );
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

beforeEach(() => {
  harness = createDomHarness();
});
afterEach(async () => {
  harness.unmount();
  await settle();
});

it("filters the localized country list by the search text", async () => {
  harness.render(<Example />);
  harness.click(trigger());
  await settle();
  expect(optionLabels().length).toBeGreaterThan(200);
  search("alema");
  expect(optionLabels()).toEqual(["Alemania"]);
  search("zzzz");
  expect(optionLabels()).toEqual([]);
  expect(dialog().textContent).toContain("No countries");
});

it("uses the locale for labels", async () => {
  harness.render(<Example locale="en" />);
  harness.click(trigger());
  await settle();
  search("germ");
  expect(optionLabels()).toEqual(["Germany"]);
});

it("selecting a country adds a chip and emits ISO codes", async () => {
  const onChange = vi.fn();
  harness.render(<Example initialValue={["AR"]} onChange={onChange} />);
  harness.click(trigger());
  await settle();
  search("alema");
  harness.click(dialog().querySelector('[role="option"]')!);
  expect(onChange).toHaveBeenLastCalledWith(["AR", "DE"]);
  expect(output()).toBe("AR,DE");
  expect(trigger().textContent).toContain("Alemania");
  expect(trigger().textContent).toContain("Argentina");
});

it("removing a chip emits the remaining codes", () => {
  const onChange = vi.fn();
  harness.render(<Example initialValue={["AR", "DE"]} onChange={onChange} />);
  const removeButtons = Array.from(trigger().querySelectorAll("button"));
  expect(removeButtons).toHaveLength(2);
  const removeArgentina = removeButtons.find((button) =>
    button.closest('[data-component="RemovableTag"]')?.textContent?.includes("Argentina"),
  )!;
  harness.click(removeArgentina);
  expect(onChange).toHaveBeenLastCalledWith(["DE"]);
  expect(output()).toBe("DE");
});

it("read-only mode shows localized chips without remove buttons or a picker", () => {
  harness.render(<Example initialValue={["DE"]} readOnly />);
  expect(harness.container.querySelector('[role="combobox"]')).toBeNull();
  expect(harness.container.querySelector("button")).toBeNull();
  expect(harness.container.textContent).toContain("Alemania");
});

it("read-only mode shows the empty label when nothing is selected", () => {
  harness.render(<Example readOnly />);
  expect(harness.container.textContent).toContain("None");
});

it("announces an error message below the picker", () => {
  harness.render(<Example error="Select at least one nationality" />);
  expect(harness.container.querySelector('[role="alert"]')?.textContent).toBe(
    "Select at least one nationality",
  );
});

it("renders no error region without an error", () => {
  harness.render(<Example />);
  expect(harness.container.querySelector('[role="alert"]')).toBeNull();
});

const schengen: CountryOption[] = [{ value: "SCHENGEN", label: "Espacio Schengen" }];

it("lists caller-supplied extra options before the countries", async () => {
  harness.render(<Example extraOptions={schengen} />);
  harness.click(trigger());
  await settle();
  expect(optionLabels()[0]).toBe("Espacio Schengen");
  expect(optionLabels().length).toBeGreaterThan(200);
});

it("selecting an extra option emits its code and shows its label", async () => {
  const onChange = vi.fn();
  harness.render(<Example extraOptions={schengen} initialValue={["US"]} onChange={onChange} />);
  harness.click(trigger());
  await settle();
  search("schen");
  expect(optionLabels()).toEqual(["Espacio Schengen"]);
  harness.click(dialog().querySelector('[role="option"]')!);
  expect(onChange).toHaveBeenLastCalledWith(["US", "SCHENGEN"]);
  expect(trigger().textContent).toContain("Espacio Schengen");
});

it("matches countries without typing accents", async () => {
  harness.render(<Example />);
  harness.click(trigger());
  await settle();
  search("mexico");
  expect(optionLabels()).toEqual(["México"]);
});

it("passes the remove-label formatter to the chips", () => {
  harness.render(
    <CountryMultiSelect
      locale="en"
      noResultsLabel="No countries"
      onChange={() => {}}
      placeholder="Choose countries"
      removeLabel={(country) => `Remove ${country}`}
      searchPlaceholder="Search countries"
      value={["DE"]}
    />,
  );
  expect(trigger().querySelector("button")?.getAttribute("aria-label")).toBe(
    "Remove Germany",
  );
});

it("read-only mode labels extra options from the caller", () => {
  harness.render(<Example extraOptions={schengen} initialValue={["SCHENGEN", "DE"]} readOnly />);
  expect(harness.container.textContent).toContain("Espacio Schengen");
  expect(harness.container.textContent).toContain("Alemania");
});
