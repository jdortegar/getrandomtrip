// Pure (client-safe) review field sets shared by the server-side diff
// (`changed-fields.ts`) and the editor's peek mapping (`blog-form-peek.ts`).

/** Fields each translation row owns; diffed per locale as `<locale>.<field>`. */
export const LOCALIZED_BLOG_FIELDS = [
  "title",
  "subtitle",
  "tagline",
  "content",
  "blocks",
  "faq",
  "seo",
] as const;

export type LocalizedBlogField = (typeof LOCALIZED_BLOG_FIELDS)[number];

/** Legacy changedFields token for the whole English JSON (copies sent before T5). */
export const LEGACY_TRANSLATIONS_TOKEN = "translations";

export function isLocalizedBlogField(field: string): field is LocalizedBlogField {
  return (LOCALIZED_BLOG_FIELDS as readonly string[]).includes(field);
}
