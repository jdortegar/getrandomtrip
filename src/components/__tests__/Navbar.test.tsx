import { act } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Navbar from "../Navbar";
import en from "@/dictionaries/en.json";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import {
  createDomHarness,
  type DomHarness,
} from "../ui/__tests__/test-dom-utils";

const navigation = vi.hoisted(() => ({ path: "/es/blog/post", push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.path,
  useRouter: () => ({ push: navigation.push }),
}));
const dict = en as unknown as Dictionary;
let harness: DomHarness;
beforeEach(() => {
  navigation.path = "/es/blog/post";
  navigation.push.mockReset();
  harness = createDomHarness();
});
afterEach(() => {
  harness.unmount();
  vi.restoreAllMocks();
  document.cookie = "NEXT_LOCALE=; path=/; max-age=0";
});
function render(locale: Locale = "es") {
  harness.render(<Navbar backgroundPrimary dict={dict} locale={locale} />);
}
function languageTrigger() {
  return harness.container.querySelector<HTMLButtonElement>(
    'button[aria-haspopup="menu"]',
  )!;
}
function localeOption(label: string) {
  return [...harness.container.querySelectorAll('[role="menuitemradio"]')].find(
    (option) => option.textContent === label,
  )!;
}

it.each(["XSED", "TGIS"])("keeps %s as plain navigation text on desktop and mobile", (label) => {
  harness.render(
    <Navbar backgroundPrimary dict={{ ...dict, nav: { ...dict.nav, labelXsed: label } }} locale="es" />,
  );
  const desktop = harness.container.querySelector('a[href="/xsed"]')!;
  expect(desktop.textContent).toBe(label);
  expect(desktop.querySelector(".bg-xsed, .text-xsed, span")).toBeNull();
  harness.click(harness.container.querySelector<HTMLButtonElement>(`button[aria-label="${dict.nav.openMenu}"]`)!);
  const mobile = harness.container.querySelector('[role="dialog"] a[href="/xsed"]')!;
  expect(mobile.textContent).toBe(label);
  expect(mobile.querySelector(".bg-xsed, .text-xsed, span")).toBeNull();
});

it.each([
  {
    locale: "es",
    path: "/es/blog/post",
    next: "en",
    label: "English",
    to: "/en/blog/post",
  },
  {
    locale: "en",
    path: "/en/experiences/drop",
    next: "es",
    label: "Español",
    to: "/experiences/drop",
  },
] as const)(
  "switches $locale to $next without losing the deep route",
  (test) => {
    navigation.path = test.path;
    const cookie = vi.spyOn(document, "cookie", "set");
    render(test.locale);
    harness.click(languageTrigger());
    expect(languageTrigger().getAttribute("aria-expanded")).toBe("true");
    expect(localeOption(test.label).getAttribute("aria-checked")).toBe("false");
    harness.click(localeOption(test.label));
    expect(cookie).toHaveBeenCalledExactlyOnceWith(
      `NEXT_LOCALE=${test.next}; path=/; max-age=31536000; sameSite=lax`,
    );
    expect(navigation.push).toHaveBeenCalledExactlyOnceWith(test.to);
    expect(cookie.mock.invocationCallOrder[0]).toBeLessThan(
      navigation.push.mock.invocationCallOrder[0],
    );
    expect(languageTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(harness.container.querySelector('[role="menu"]')).toBeNull();
  },
);

it.each(["outside click", "Escape"])(
  "closes the language menu on %s",
  (action) => {
    render();
    harness.click(languageTrigger());
    expect(
      harness.container.querySelectorAll('[role="menuitemradio"]'),
    ).toHaveLength(2);
    if (action === "outside click") harness.click(document.body);
    else
      act(() =>
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })),
      );
    expect(languageTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(harness.container.querySelector('[role="menu"]')).toBeNull();
    expect(navigation.push).not.toHaveBeenCalled();
  },
);

it("uses the current route and locale after rerender, without persisting during render", () => {
  const cookie = vi.spyOn(document, "cookie", "set");
  render();
  navigation.path = "/en/trippers/alex";
  render("en");
  expect(cookie).not.toHaveBeenCalled();
  expect(navigation.push).not.toHaveBeenCalled();
  harness.click(languageTrigger());
  expect(localeOption("English").getAttribute("aria-checked")).toBe("true");
  expect(
    harness.container
      .querySelector('a[aria-current="page"]')
      ?.getAttribute("href"),
  ).toBe("/en/trippers");
  harness.click(localeOption("Español"));
  expect(navigation.push).toHaveBeenCalledExactlyOnceWith("/trippers/alex");
});

it.each([
  { locale: "es", next: "EN", path: "/contact", to: "/en/contact" },
  { locale: "en", next: "ES", path: "/en", to: "/" },
] as const)(
  "keeps the mobile drawer open when switching from $locale",
  (test) => {
    navigation.path = test.path;
    render(test.locale);
    const trigger = harness.container.querySelector<HTMLButtonElement>(
      `button[aria-label="${dict.nav.openMenu}"]`,
    )!;
    harness.click(trigger);
    const dialog = harness.container.querySelector('[role="dialog"]')!;
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const option = [...dialog.querySelectorAll("button")].find(
      (button) => button.textContent === test.next,
    )!;
    harness.click(option);
    expect(navigation.push).toHaveBeenCalledExactlyOnceWith(test.to);
    expect(dialog.getAttribute("aria-hidden")).toBe("false");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    harness.click(
      dialog.querySelector(`button[aria-label="${dict.nav.closeMenu}"]`)!,
    );
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  },
);
