/**
 * Builds /llms.txt (https://llmstxt.org): a plain-text brief for AI engines.
 * Every product fact comes from the dictionaries so it can't drift from the site.
 */
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { Locale } from "@/lib/i18n/config";
import { canonicalUrl } from "./urls";

type Dict = typeof en;

const HEADINGS: Record<
  Locale,
  { faq: string; howItWorks: string; pages: string }
> = {
  en: {
    faq: "FAQ (English)",
    howItWorks: "How it works (English)",
    pages: "Key pages (English)",
  },
  es: {
    faq: "Preguntas frecuentes (Español)",
    howItWorks: "Cómo funciona (Español)",
    pages: "Páginas principales (Español)",
  },
};

const FAQ_SUFFIX: Record<Locale, string> = {
  en: "FAQ (English)",
  es: "preguntas frecuentes (Español)",
};

function pageLinks(locale: Locale, dict: Dict): string[] {
  const pages: Array<[string, string, string]> = [
    ["/", "Randomtrip", dict.home.meta.description],
    ["/experiences", dict.nav.labelExperiences, dict.experiences.hero.subtitle],
    ["/xsed", dict.nav.labelXsed, dict.xsedPage.faq.description],
    ["/faq", dict.faqPage.meta.title, dict.faqPage.meta.description],
    ["/about-us", dict.nav.labelNosotros, dict.aboutUs.meta.description],
  ];
  return pages.map(
    ([path, name, note]) =>
      `- [${name}](${canonicalUrl(locale, path)}): ${note}`,
  );
}

function qa(items: Array<{ answer: string; question: string }>): string[] {
  return items.flatMap((item) => [`### ${item.question}`, "", item.answer, ""]);
}

function localeSection(locale: Locale, dict: Dict): string[] {
  const h = HEADINGS[locale];
  return [
    `## ${h.howItWorks}`,
    "",
    ...dict.home.homeInfo.howItWorksSteps.map(
      (step, i) => `${i + 1}. ${step.title}: ${step.description}`,
    ),
    "",
    `## ${h.faq}`,
    "",
    ...qa(dict.faqPage.block.items),
    `## ${dict.nav.labelXsed} ${FAQ_SUFFIX[locale]}`,
    "",
    ...qa(dict.xsedPage.faq.items),
    `## ${h.pages}`,
    "",
    ...pageLinks(locale, dict),
    "",
  ];
}

export function buildLlmsTxt(): string {
  return [
    "# Randomtrip",
    "",
    `> ${en.home.meta.description}`,
    "",
    es.home.meta.description,
    "",
    ...localeSection("en", en),
    ...localeSection("es", es as Dict),
  ].join("\n");
}
