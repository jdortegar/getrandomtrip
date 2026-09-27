import { afterEach, beforeEach, expect, it } from "vitest";
import Footer from "@/components/layout/Footer";
import {
  createDomHarness,
  type DomHarness,
} from "@/components/ui/__tests__/test-dom-utils";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/lib/i18n/dictionaries";

let harness: DomHarness;

beforeEach(() => {
  harness = createDomHarness();
});

afterEach(() => {
  harness.unmount();
});

it.each([
  { locale: "en", copy: en, prefix: "/en" },
  { locale: "es", copy: es, prefix: "" },
] as const)("omits About Us while retaining other footer links in $locale", ({ locale, copy, prefix }) => {
  const dict = copy as unknown as Dictionary;
  harness.render(<Footer dict={dict} locale={locale} />);

  expect(harness.container.querySelector('a[href$="/about-us"]')).toBeNull();
  for (const [path, label] of [
    ["/blog", dict.footer.inspiration],
    ["/faq", dict.footer.faq],
    ["/contact", dict.footer.contact],
  ]) {
    expect(
      harness.container.querySelector(`a[href="${prefix}${path}"]`)?.textContent,
    ).toBe(label);
  }
});
