import type { BlogStatus } from "@/types/blog";

/**
 * Row-action kind resolved purely from status — the tripper dashboard's
 * `BlogPageClient` action column state machine (replaces the old direct
 * `handleTogglePublish` toggle). Extracted as a pure function per the Mock
 * Hygiene Rule (component render tests are skipped; this branching logic is
 * unit-tested directly instead).
 *
 * - draft                  -> "none"    (submitting for review only happens
 *                                        inside the wizard — same as
 *                                        experiences, no list-page shortcut)
 * - pending_review         -> "waiting" (disabled waiting indicator, no action)
 * - pending_tripper_review -> "review"  (link to the tripper review-copy page)
 * - published              -> "none"    (no manual unpublish — proposal decision 3)
 */
export type BlogRowActionKind = "waiting" | "review" | "none";

export function resolveBlogRowAction(status: BlogStatus): BlogRowActionKind {
  switch (status) {
    case "pending_review":
      return "waiting";
    case "pending_tripper_review":
      return "review";
    case "draft":
    case "published":
    default:
      return "none";
  }
}

/**
 * Mirrors the `locked_for_review` guard in `DELETE /api/tripper/blogs/[id]`
 * — a post pending either review decision can't be deleted server-side, so
 * the delete button and bulk-select checkbox are both disabled for it here
 * rather than letting the request fail after the fact.
 */
export function isBlogRowLockedForDeletion(status: BlogStatus): boolean {
  return status === "pending_review" || status === "pending_tripper_review";
}
