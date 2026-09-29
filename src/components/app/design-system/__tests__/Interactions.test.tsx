import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BadgeExamples } from "../BadgeExamples";
import { ButtonExamples } from "../ButtonExamples";
import { ControlExamples } from "../ControlExamples";
import { TableExamples } from "../TableExamples";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { DesignSystemDict } from "@/lib/types/dictionary";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement;
let root: Root;
const copy = en.designSystem as DesignSystemDict;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  expect(fetch).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

function button(label: string) {
  return Array.from(container.querySelectorAll("button")).find(
    (element) => element.textContent === label,
  )!;
}
function inputValue(element: HTMLInputElement, value: string) {
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

it("uses live button variants and keeps disabled actions inert", () => {
  act(() => root.render(<ButtonExamples copy={copy} />));
  act(() => button(copy.buttons.labels.secondary).click());
  const feedback = container.querySelector('[role="status"]')!.textContent;
  expect(feedback).toContain(copy.buttons.labels.secondary);
  expect(button(copy.buttons.disabled).disabled).toBe(true);
  act(() => button(copy.buttons.disabled).click());
  expect(container.querySelector('[role="status"]')!.textContent).toBe(
    feedback,
  );
  expect(container.querySelector('a[href="#controls"]')).not.toBeNull();
  expect(container.querySelector("details summary")!.textContent).toBe(
    copy.usage,
  );
});

describe.each([en.designSystem, es.designSystem])(
  "localized controls",
  (raw) => {
    const localized = raw as DesignSystemDict;
    it("associates native validation errors, focuses the invalid field, and recovers locally", () => {
      act(() => root.render(<ControlExamples copy={localized} />));
      const email =
        container.querySelector<HTMLInputElement>('[name="email"]')!;
      const form = container.querySelector("form")!;
      const submit = () =>
        act(() =>
          form.dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
          ),
        );
      submit();
      expect(email.getAttribute("aria-invalid")).toBe("true");
      expect(email.getAttribute("aria-describedby")).toContain(
        "demo-email-error",
      );
      expect(container.querySelector("#demo-email-error")!.textContent).toBe(
        localized.controls.error,
      );
      expect(document.activeElement).toBe(email);
      inputValue(email, "bad-address");
      submit();
      expect(email.getAttribute("aria-invalid")).toBe("true");
      inputValue(email, "demo@example.com");
      expect(email.hasAttribute("aria-invalid")).toBe(false);
      submit();
      expect(container.querySelector('[role="status"]')!.textContent).toBe(
        localized.controls.success,
      );
      expect(
        container.querySelector<HTMLInputElement>("#demo-readonly")!.readOnly,
      ).toBe(true);
      expect(
        container.querySelector<HTMLInputElement>("#demo-disabled")!.disabled,
      ).toBe(true);
    });
  },
);

it("updates switch, select, bounded quantity, and chip states", () => {
  act(() =>
    root.render(
      <>
        <ControlExamples copy={copy} />
        <BadgeExamples copy={copy} />
      </>,
    ),
  );
  const toggle = container.querySelector<HTMLButtonElement>('[role="switch"]')!;
  expect(
    container.querySelector(`label[for="${toggle.id}"]`)!.textContent,
  ).toBe(copy.controls.updates);
  act(() => toggle.click());
  expect(toggle.getAttribute("aria-checked")).toBe("true");
  const select = container.querySelector("select")!;
  act(() => {
    select.value = "slow";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(select.value).toBe("slow");
  const decrease = container.querySelector<HTMLButtonElement>(
    `[aria-label="${copy.controls.decrease}"]`,
  )!;
  act(() => decrease.click());
  expect(decrease.disabled).toBe(true);
  const increase = container.querySelector<HTMLButtonElement>(
    `[aria-label="${copy.controls.increase}"]`,
  )!;
  for (let count = 0; count < 6; count++) act(() => increase.click());
  expect(increase.disabled).toBe(true);
  act(() => button(copy.badges.chips[0]).click());
  expect(button(copy.badges.chips[0]).getAttribute("aria-pressed")).toBe(
    "true",
  );
  act(() => button(copy.badges.chips[0]).click());
  expect(button(copy.badges.chips[0]).getAttribute("aria-pressed")).toBe(
    "false",
  );
});

it("filters, clears, sorts, and paginates fictional table rows without stale pages", () => {
  act(() => root.render(<TableExamples copy={copy} />));
  const body = () => container.querySelector("tbody")!;
  expect(body().querySelectorAll("tr")).toHaveLength(3);
  const first = body().textContent;
  expect(button(copy.tables.previous).disabled).toBe(true);
  act(() => button(copy.tables.next).click());
  expect(body().textContent).not.toBe(first);
  expect(button(copy.tables.next).disabled).toBe(true);
  const search = container.querySelector<HTMLInputElement>(
    'input[type="search"]',
  )!;
  inputValue(search, "Forest");
  expect(body().querySelectorAll("tr")).toHaveLength(1);
  expect(body().textContent).toContain("Forest hideaway");
  expect(body().textContent).not.toContain(copy.tables.empty);
  inputValue(search, "no matches");
  expect(body().textContent).toBe(copy.tables.empty);
  act(() => button(copy.tables.toolbar.clearFilters).click());
  expect(button(copy.tables.previous).disabled).toBe(true);
  const status = container.querySelector("select")!;
  act(() => {
    status.value = "ACTIVE";
    status.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(body().querySelectorAll("tr")).toHaveLength(2);
  act(() => button(copy.tables.toolbar.clearFilters).click());
  const sortNights = container.querySelector<HTMLButtonElement>(
    `[aria-label="${copy.tables.sort.replace("{column}", copy.tables.nights)}"]`,
  )!;
  act(() => sortNights.click());
  expect(sortNights.closest("th")!.getAttribute("aria-sort")).toBe("ascending");
  expect(body().querySelector("td")!.textContent).toBe("2");
  act(() => sortNights.click());
  expect(sortNights.closest("th")!.getAttribute("aria-sort")).toBe(
    "descending",
  );
  expect(body().querySelector("td")!.textContent).toBe("5");
});
