import type { ContentLocale } from "@/types/blog";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import { isContentLocale } from "./locales";
import { LOCALIZED_BLOG_FIELDS, LEGACY_TRANSLATIONS_TOKEN } from "./review-fields";

const SHARED_FIELD_KEYS = [
  "sourceLocale",
  "coverUrl",
  "tags",
  "travelType",
  "excuseKey",
  "level",
  "label",
] as const;

function fieldLabel(
  field: string,
  fields: TripperBlogFormDict["changedFieldsBanner"]["fields"],
): string {
  return fields[field as keyof typeof fields] ?? field;
}

function withLocale(
  label: string,
  locale: ContentLocale,
  dict: TripperBlogFormDict["changedFieldsBanner"],
): string {
  return `${label} (${dict.locale[locale]})`;
}

/** Localized review-banner labels for `<locale>.<field>`, `<locale>.*`,
 * shared tokens, and leftover legacy tokens. */
export function labelBlogChangedFields(
  tokens: string[],
  dict: TripperBlogFormDict["changedFieldsBanner"],
): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();
  const push = (label: string) => {
    if (seen.has(label)) return;
    seen.add(label);
    labels.push(label);
  };

  for (const token of tokens) {
    if (token === LEGACY_TRANSLATIONS_TOKEN) {
      for (const field of LOCALIZED_BLOG_FIELDS)
        push(withLocale(fieldLabel(field, dict.fields), "en", dict));
      continue;
    }
    if ((SHARED_FIELD_KEYS as readonly string[]).includes(token)) {
      push(fieldLabel(token, dict.fields));
      continue;
    }
    if ((LOCALIZED_BLOG_FIELDS as readonly string[]).includes(token)) {
      push(withLocale(fieldLabel(token, dict.fields), "es", dict));
      continue;
    }
    const dot = token.indexOf(".");
    if (dot === -1) {
      push(fieldLabel(token, dict.fields));
      continue;
    }
    const locale = token.slice(0, dot);
    const field = token.slice(dot + 1);
    if (!isContentLocale(locale)) {
      push(token);
      continue;
    }
    if (field === "*") {
      push(withLocale(dict.all, locale, dict));
      continue;
    }
    push(withLocale(fieldLabel(field, dict.fields), locale, dict));
  }
  return labels;
}
