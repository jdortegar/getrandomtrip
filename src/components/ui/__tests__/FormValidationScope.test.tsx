import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { FormValidationScope } from "../FormValidationScope";
import { FormField, FormSelectField } from "../FormField";
import { TextAreaInput } from "../TextAreaInput";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});
function render(errors: { path: string; code: string }[], focusRequest = 0) {
  act(() =>
    root.render(
      <FormValidationScope
        errors={errors}
        focusRequest={focusRequest}
        messages={{
          required: "Completa este campo.",
          invalid: "Revisa este valor.",
        }}
      >
        <FormField
          aria-describedby="hint"
          id="name"
          label="Nombre"
          name="data.name"
        />
        <FormSelectField id="country" label="País" name="country">
          <option value="">—</option>
        </FormSelectField>
        <TextAreaInput
          id="directions"
          label="Indicaciones"
          name="data.stops.0.directions"
        />
      </FormValidationScope>,
    ),
  );
}
it("connects translated inline errors to every control and focuses the first invalid control", () => {
  render(
    [
      { path: "data.name", code: "required" },
      { path: "country", code: "required" },
      { path: "data.stops.0.directions", code: "required" },
    ],
    1,
  );
  for (const id of ["name", "country", "directions"]) {
    const control = host.querySelector(`#${id}`)!;
    expect(control.getAttribute("aria-invalid")).toBe("true");
    expect(control.getAttribute("aria-describedby")).toContain(`${id}-error`);
    expect(host.querySelector(`#${id}-error`)?.textContent).toBe(
      "Completa este campo.",
    );
  }
  expect(host.querySelector("#name")?.getAttribute("aria-describedby")).toBe(
    "hint name-error",
  );
  expect(document.activeElement?.id).toBe("name");
});
it("clears obsolete errors without stealing focus and safely translates unknown codes", () => {
  render([{ path: "data.name", code: "required" }], 1);
  (host.querySelector("#directions") as HTMLTextAreaElement).focus();
  render([{ path: "country", code: "private exception" }], 1);
  expect(host.querySelector("#name")?.hasAttribute("aria-invalid")).toBe(false);
  expect(host.querySelector("#name")?.getAttribute("aria-describedby")).toBe(
    "hint",
  );
  expect(host.querySelector("#name-error")).toBeNull();
  expect(host.querySelector("#country-error")?.textContent).toBe(
    "Revisa este valor.",
  );
  expect(host.textContent).not.toContain("private exception");
  expect(document.activeElement?.id).toBe("directions");
});
it("does not change controls outside an opted-in validation scope", () => {
  act(() =>
    root.render(<FormField id="ordinary" label="Ordinary" name="data.name" />),
  );
  expect(host.querySelector("input")?.hasAttribute("aria-invalid")).toBe(false);
  expect(host.querySelector("[id$='-error']")).toBeNull();
});
