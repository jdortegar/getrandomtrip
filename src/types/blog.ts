export type BlogStatus =
  | "draft"
  | "pending_review"
  | "pending_tripper_review"
  | "published";
export type BlogFormat = "article" | "photo" | "video" | "mixed";

export interface BlogPost {
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
  /** Journey excuse key (e.g. solo-adventure); used for discovery filters. */
  excuseKey?: string | null;
  /** Journey traveler type key (e.g. solo, couple); used for discovery filters. */
  travelType?: string | null;
  format: BlogFormat;
  status: BlogStatus;
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

/**
 * Draft shape for the tabs + accordion "new blog post" shell
 * (`NewBlogPostShell`). This is the flat, form-friendly representation
 * edited in the UI — distinct from `BlogPost` (the API/DB shape).
 * `buildBlogSubmitPayload` (src/lib/helpers/blog-form.ts) converts it into
 * the POST/PATCH `/api/tripper/blogs` payload.
 */
export interface BlogFormDraft {
  status: BlogStatus;
  title: string;
  subtitle: string;
  coverUrl: string;
  featureText: string;
  featureAttribution: string;
  sections: { title: string; description: string }[];
  faq: { question: string; answer: string }[];
  gallery: string[];
  /** Tripper's note to the admin at submission time. */
  tripperNote?: string | null;
}

export type BlogFormDraftOnChange = <K extends keyof BlogFormDraft>(
  key: K,
  value: BlogFormDraft[K],
) => void;
