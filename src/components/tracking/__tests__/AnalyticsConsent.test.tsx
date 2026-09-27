import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import AnalyticsConsent from "../AnalyticsConsent";
import { readAnalyticsConsent } from "@/lib/helpers/tracking/consent";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
function button(label: string) {
  return [...container.querySelectorAll("button")].find(
    (el) => el.textContent === label,
  )!;
}
beforeEach(() => {
  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
it.each([en.analyticsConsent, es.analyticsConsent])(
  "offers accept/reject and persistent withdrawal control: $title",
  (copy) => {
    act(() => root.render(<AnalyticsConsent copy={copy} />));
    expect(
      container.querySelector("section")?.getAttribute("aria-labelledby"),
    ).toBe("analytics-consent-title");
    expect(button(copy.reject)).toBeTruthy();
    act(() => button(copy.accept).click());
    expect(readAnalyticsConsent()).toBe("granted");
    expect(container.querySelector("section")).toBeNull();
    act(() => button(copy.preferences).click());
    act(() => button(copy.reject).click());
    expect(readAnalyticsConsent()).toBe("denied");
    expect(button(copy.preferences)).toBeTruthy();
  },
);
