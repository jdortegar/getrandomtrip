import type { Locale } from "@/lib/i18n/config";

export type BlogStatus =
  | "draft"
  | "pending_review"
  | "pending_tripper_review"
  | "published";
export type BlogFormat = "article" | "photo" | "video" | "mixed";

/** A locale a blog translation row can be authored in (derived from LOCALES). */
export type ContentLocale = Locale;

/** One ordered content block; media URLs are shared, captions/titles localized. */
export type BlogBlock = BlogPost["blocks"][number];

/** Media blocks whose URL must match across translations of the same post. */
export type BlogMediaBlock = Extract<BlogBlock, { type: "image" | "video" | "embed" }>;

/** Localized content of one `blog_post_translations` row (slug and isComplete are server-owned). */
export interface BlogTranslationContent {
  title: string;
  subtitle?: string | null;
  tagline?: string | null;
  content?: string | null;
  blocks?: BlogBlock[];
  faq?: BlogPost["faq"];
  seo?: BlogPost["seo"] | null;
}

/** Non-blocking editor warning: media URLs a translation lacks or adds vs. its source. */
export interface BlogMediaMismatch {
  missing: string[];
  extra: string[];
}

/** Slug of each publicly complete translation of one post, keyed by locale. */
export type BlogLocaleSlugs = Partial<Record<ContentLocale, string>>;

/** Public author fields shared by blog list and detail reads. */
export interface PublicBlogAuthor {
  id: string;
  name: string;
  tripperSlug: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  motto: string | null;
  specialization: string | null;
}

/** Flattened public list item: shared post fields + one complete translation. */
export interface PublicBlogSummary {
  id: string;
  authorId: string;
  /** The translation's own slug (post id when it has none). */
  slug: string;
  locale: ContentLocale;
  availableLocales: ContentLocale[];
  localeSlugs: BlogLocaleSlugs;
  title: string;
  subtitle: string | null;
  tagline: string | null;
  coverUrl: string | null;
  tags: string[];
  travelType: string[];
  excuseKey: string[];
  level: string | null;
  label: string | null;
  /** Prisma BlogFormat enum value (e.g. "ARTICLE"). */
  format: string;
  source: "TRIPPER" | "RANDOMTRIP";
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: PublicBlogAuthor;
}

/** Flattened public detail: list fields + the translation's article body. */
export interface PublicBlogPost extends PublicBlogSummary {
  content: string | null;
  blocks?: BlogBlock[];
  faq: unknown;
  seo: BlogPost["seo"] | null;
}

/** Filters accepted by the public blog list (all optional, AND-combined). */
export interface PublicBlogListFilters {
  authorId?: string | string[];
  level?: string;
  travelType?: string;
  excuseKey?: string;
  /** Only posts with a cover image. */
  requireCover?: boolean;
  /** Case-insensitive match on the requested locale's translation title. */
  search?: string;
  orderBy?: "publishedAt" | "createdAt";
  take?: number;
}

export type PublicBlogLookup =
  | { kind: "found"; post: PublicBlogPost }
  | { kind: "redirect"; slug: string }
  | { kind: "not_found" };

export interface BlogTranslation {
  title?: string;
  subtitle?: string | null;
  tagline?: string | null;
  content?: string | null;
  blocks?: BlogPost["blocks"];
  faq?: BlogPost["faq"];
  seo?: BlogPost["seo"] | null;
  /** Server-derived only; ignored on client writes. */
  ready?: boolean;
}

export interface BlogTranslations {
  en?: BlogTranslation | null;
}

export interface BlogPost {
  translations?: BlogTranslations | null;
  id: string;
  slug?: string;
  authorId: string;
  coverUrl?: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  content?: string | null;
  blocks: Array<
    | { type: "paragraph"; text: string }
    | { type: "image"; url: string; caption?: string }
    | { type: "video"; url: string; caption?: string } // soporta mp4 u HLS
    | {
        type: "embed";
        provider: "youtube" | "vimeo" | "map" | "other";
        url: string;
        title?: string;
      }
    | { type: "quote"; text: string; cite?: string }
    | { type: "faq"; items: { question: string; answer: string }[] }
    | { type: "section"; title: string; description: string }
  >;
  faq?: { items: { question: string; answer: string }[] } | null;
  tags: string[];
  /** Journey excuse keys (e.g. solo-adventure); used for discovery filters. */
  excuseKey: string[];
  /** Journey traveler type keys (e.g. solo, couple); used for discovery filters. */
  travelType: string[];
  /** One of EXPERIENCE_LEVELS' values (src/lib/constants/packages.ts), or null for none. XSED is a level, not a travelType. */
  level?: string | null;
  /** Display ID shown on the XSED grid (e.g. "XSED Nº1 (AR)"), or null for none. */
  label?: string | null;
  format: BlogFormat;
  status: BlogStatus;
  source?: "TRIPPER" | "RANDOMTRIP";
  /** Visibility toggle, decoupled from status — a PUBLISHED post can be hidden without losing approval history. */
  isActive: boolean;
  seo?: { title?: string; description?: string; keywords?: string[] };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  /** Review pipeline fields — present on tripper/admin surfaces only. */
  reviewNote?: string | null;
  tripperNote?: string | null;
  isReviewCopy?: boolean;
  parentId?: string | null;
  reviewLockedBy?: string | null;
  changedFields?: string[];
  isDiscarded?: boolean;
}

/** Server-owned, read-only facts about one translation row (decision 8). */
export interface BlogTranslationMeta {
  slug: string | null;
  isComplete: boolean;
}

/** One translation row as the editor reads it. */
export interface BlogEditorTranslation extends BlogTranslationContent, BlogTranslationMeta {}

export type BlogEditorTranslations = Partial<Record<ContentLocale, BlogEditorTranslation>>;

/** Editor read model (`getForEditor`): shared post fields plus every
 * translation keyed by locale. `status`/`format` are raw Prisma enum values. */
export interface BlogEditorPost {
  id: string;
  authorId: string;
  source: "TRIPPER" | "RANDOMTRIP";
  status: string;
  format: string;
  sourceLocale: ContentLocale;
  coverUrl: string | null;
  tags: string[];
  travelType: string[];
  excuseKey: string[];
  level: string | null;
  label: string | null;
  isActive: boolean;
  isReviewCopy: boolean;
  parentId: string | null;
  reviewNote: string | null;
  tripperNote: string | null;
  reviewLockedBy: string | null;
  changedFields: string[];
  publishedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  author: PublicBlogAuthor | null;
  translations: BlogEditorTranslations;
}

/** Text the editor edits for one locale (form-friendly, flat). */
export interface BlogLocaleDraft {
  title: string;
  subtitle: string;
  featureText: string;
  featureAttribution: string;
  sections: { title: string; description: string }[];
  faq: { question: string; answer: string }[];
  tagline?: string;
  seo?: BlogPost["seo"];
  /** The translation as loaded; unchanged text keeps its exact HTML/blocks on save. */
  original?: BlogTranslationContent;
  /** Localized media blocks (captions, embed titles). URLs follow the shared gallery. */
  media?: BlogMediaBlock[];
}

/**
 * Editor state of `NewBlogPostShell`: shared post fields, the source locale
 * and one `BlogLocaleDraft` per translation (every locale symmetric).
 * `buildBlogSubmitPayload` (src/lib/helpers/blog-form.ts) converts it into
 * the POST/PATCH `/api/tripper/blogs` payload.
 */
export interface BlogEditorDraft {
  sourceLocale: ContentLocale;
  translations: Partial<Record<ContentLocale, BlogLocaleDraft>>;
  /** Read-only slug/completeness of the saved rows. */
  translationMeta?: Partial<Record<ContentLocale, BlogTranslationMeta>>;
  publishedAt?: Date | string | null;
  isReviewCopy?: boolean;
  status: BlogStatus;
  coverUrl: string;
  gallery: string[];
  travelType: string[];
  excuseKey: string[];
  level: string;
  label: string;
  tripperNote?: string | null;
}

/** Translation payload the editor sends for one locale (slug/isComplete are server-owned). */
export interface BlogTranslationInput {
  title: string;
  subtitle: string | null;
  tagline?: string | null;
  content: string | null;
  blocks: BlogBlock[];
  faq: BlogPost["faq"] | null;
  seo?: BlogPost["seo"] | null;
}

/** POST/PATCH/edit-copy body built from a `BlogEditorDraft`. */
export interface BlogEditorPayload {
  sourceLocale: ContentLocale;
  translations: Partial<Record<ContentLocale, BlogTranslationInput>>;
  coverUrl: string | null;
  travelType: string[];
  excuseKey: string[];
  level: string | null;
  label: string | null;
  tripperNote: string | null;
}

/**
 * Flat single-locale view consumed by the step components: shared fields
 * plus the displayed locale's copy (see `getBlogLocaleView`).
 */
export interface BlogFormDraft {
  tagline?: string;
  seo?: BlogPost["seo"];
  status: BlogStatus;
  title: string;
  subtitle: string;
  coverUrl: string;
  featureText: string;
  featureAttribution: string;
  sections: { title: string; description: string }[];
  faq: { question: string; answer: string }[];
  gallery: string[];
  /** Journey traveler type keys (e.g. solo, couple); used for discovery filters. */
  travelType: string[];
  /** Journey excuse keys (e.g. solo-adventure), scoped to the selected travelType(s). */
  excuseKey: string[];
  /** One of EXPERIENCE_LEVELS' values, or "" for none. XSED is admin-only (see TitleImageStep). Independent of travelType. */
  level: string;
  /** Display ID shown on the XSED grid (e.g. "XSED Nº1 (AR)"), or "" for none. */
  label: string;
  /** Tripper's note to the admin at submission time. */
  tripperNote?: string | null;
}

export type BlogFormDraftOnChange = <K extends keyof BlogFormDraft>(
  key: K,
  value: BlogFormDraft[K],
) => void;
