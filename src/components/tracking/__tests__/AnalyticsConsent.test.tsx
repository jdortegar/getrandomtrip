import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import AnalyticsConsent from "../AnalyticsConsent";
import Footer from "@/components/layout/Footer";
import { WaitlistPage } from "@/components/waitlist/WaitlistPage";
import { readAnalyticsConsent } from "@/lib/helpers/tracking/consent";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { useAnalyticsPreferencesStore } from "@/store/slices/analyticsPreferencesStore";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

vi.mock("@/components/common/Img", () => ({ default: () => null }));

const locales = [
  { dict: en as unknown as Dictionary, locale: "en" as Locale },
  { dict: es as unknown as Dictionary, locale: "es" as Locale },
];
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
function button(label: string) {
  return [...container.querySelectorAll("button")].find(
    (el) => (el.getAttribute("aria-label") ?? el.textContent) === label,
  )!;
}
beforeEach(() => {
  useAnalyticsPreferencesStore.setState({ open: false });
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
  vi.restoreAllMocks();
});
it.each(locales)(
  "offers accept/reject and a single Legal footer withdrawal control: $locale",
  ({ dict, locale }) => {
    const copy = dict.analyticsConsent;
    act(() =>
      root.render(
        <>
          <Footer dict={dict} locale={locale} />
          <AnalyticsConsent copy={copy} />
        </>,
      ),
    );
    expect(
      container.querySelector("section")?.getAttribute("aria-labelledby"),
    ).toBe("analytics-consent-title");
    expect(button(copy.reject)).toBeTruthy();
    expect(button(copy.close)).toBeUndefined();
    expect(container.querySelectorAll("section button")).toHaveLength(2);
    const preferences = button(copy.preferences);
    expect(preferences.closest("footer")).not.toBeNull();
    expect(preferences.closest("ul")?.previousElementSibling?.textContent).toBe(
      dict.footer.legalTitle,
    );
    expect(preferences.getAttribute("type")).toBe("button");
    expect(preferences.classList.contains("fixed")).toBe(false);
    act(() => preferences.click());
    expect(button(copy.close)).toBeUndefined();
    expect(readAnalyticsConsent()).toBeNull();
    act(() => button(copy.accept).click());
    expect(readAnalyticsConsent()).toBe("granted");
    expect(container.querySelector("section")).toBeNull();
    act(() => button(copy.preferences).click());
    act(() => button(copy.reject).click());
    expect(readAnalyticsConsent()).toBe("denied");
    expect(button(copy.preferences)).toBeTruthy();
    expect(container.querySelectorAll("button")).toHaveLength(1);
    act(() => button(copy.preferences).click());
    expect(
      container.querySelectorAll('[aria-labelledby="analytics-consent-title"]'),
    ).toHaveLength(1);
    act(() => button(copy.close).click());
  },
);

it.each(
  locales.flatMap(({ dict, locale }) =>
    (["granted", "denied"] as const).map((consent) => ({
      dict,
      locale,
      consent,
    })),
  ),
)(
  "closes footer-opened preferences with a localized corner icon without changing $consent consent: $locale",
  ({ dict, locale, consent }) => {
    const copy = dict.analyticsConsent;
    act(() =>
      root.render(
        <>
          <Footer dict={dict} locale={locale} />
          <AnalyticsConsent copy={copy} />
        </>,
      ),
    );
    act(() =>
      button(consent === "granted" ? copy.accept : copy.reject).click(),
    );
    const setItem = vi.spyOn(window.localStorage, "setItem");
    const dispatchEvent = vi.spyOn(window, "dispatchEvent");
    act(() => button(copy.preferences).click());

    const close = button(copy.close);
    expect(close.getAttribute("aria-label")).toBe(copy.close);
    expect(close.getAttribute("type")).toBe("button");
    expect(close.textContent).toBe("");
    expect(close.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(close.parentElement).toBe(container.querySelector("section"));
    expect(close.classList.contains("absolute")).toBe(true);
    expect(close.classList.contains("right-4")).toBe(true);
    expect(close.classList.contains("top-4")).toBe(true);
    expect(
      button(copy.accept).parentElement?.querySelectorAll("button"),
    ).toHaveLength(2);

    act(() => close.click());

    expect(container.querySelector("section")).toBeNull();
    expect(button(copy.preferences)).toBeTruthy();
    expect(readAnalyticsConsent()).toBe(consent);
    expect(setItem).not.toHaveBeenCalled();
    expect(dispatchEvent).not.toHaveBeenCalled();

    act(() => button(copy.preferences).click());
    expect(button(copy.close)).toBeTruthy();
    act(() => button(copy.close).click());
  },
);

it.each(locales)(
  "retains withdrawal access in the waitlist footer: $locale",
  ({ dict }) => {
    const copy = dict.analyticsConsent;
    act(() =>
      root.render(
        <>
          <WaitlistPage
            analyticsPreferencesLabel={copy.preferences}
            dict={dict.waitlist}
            onOpenLogin={() => {}}
          />
          <AnalyticsConsent copy={copy} />
        </>,
      ),
    );
    act(() => button(copy.accept).click());
    expect(
      container.querySelector('[aria-labelledby="analytics-consent-title"]'),
    ).toBeNull();
    expect(button(copy.preferences).closest("footer")).not.toBeNull();
    act(() => button(copy.preferences).click());
    expect(readAnalyticsConsent()).toBe("granted");
    act(() => button(copy.reject).click());
    expect(readAnalyticsConsent()).toBe("denied");
    act(() => button(copy.preferences).click());
    expect(button(copy.close)).toBeTruthy();
    act(() => button(copy.close).click());
  },
);

it.each([en.analyticsConsent, es.analyticsConsent])(
  "keeps first-visit consent global without a footer: $title",
  (copy) => {
    act(() => root.render(<AnalyticsConsent copy={copy} />));
    expect(button(copy.accept)).toBeTruthy();
    expect(button(copy.reject)).toBeTruthy();
    act(() => button(copy.reject).click());
    expect(container.innerHTML).toBe("");
  },
);
