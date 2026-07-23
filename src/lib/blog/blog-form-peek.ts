import type { BlogFormDraft } from "@/types/blog";
import type { FieldPeek } from "@/components/ui/field-peek";

export interface ResolveBlogFieldPeekArgs {
  field: keyof BlogFormDraft;
  /**
   * DB-level `changedFields` key gating eligibility, when different from
   * `field` — `featureText`/`featureAttribution`/`sections` are all folded
   * into the single `blocks` column server-side (see
   * `src/lib/blog/changed-fields.ts`'s `MUTABLE_BLOG_FIELDS`), so they're
   * gated by `"blocks"` rather than their own form-field name. Defaults to
   * `field` for the fields that map 1:1 (title, subtitle, coverUrl).
   */
  diffKey?: string;
  changedFieldSet: Set<string> | null | undefined;
  originalDraft: BlogFormDraft | undefined;
  peekedFields: Set<string>;
  onToggle: () => void;
  copy: {
    peekShowOriginal: string;
    peekShowSuggestion: string;
    noContent: string;
  };
}

/**
 * Builds the `FieldPeek` for a single scalar field, or `undefined` when the
 * field is not eligible (not in `changedFieldSet`, or no `originalDraft` to
 * peek at). Pure function — no DOM or client dependencies; toggle state
 * lives in the caller. Blog analogue of `resolveFieldPeek`
 * (src/lib/helpers/experience-form-peek.ts) — a dedicated parallel
 * implementation, not a shared one.
 */
export function resolveBlogFieldPeek({
  field,
  diffKey,
  changedFieldSet,
  originalDraft,
  peekedFields,
  onToggle,
  copy,
}: ResolveBlogFieldPeekArgs): FieldPeek | undefined {
  if (!changedFieldSet?.has(diffKey ?? field) || !originalDraft) return undefined;

  const rawValue = originalDraft[field];

  return {
    originalValue: String(rawValue ?? ""),
    active: peekedFields.has(field),
    onToggle,
    tooltip: {
      showOriginal: copy.peekShowOriginal,
      showSuggestion: copy.peekShowSuggestion,
    },
    emptyLabel: copy.noContent,
  };
}

export interface ResolveBlogEntryPeekArgs<Entry> {
  /** `changedFields` key gating the whole array (e.g. "faq", or "blocks" for sections). */
  diffKey: string;
  changedFieldSet: Set<string> | null | undefined;
  /** The original entry at this index, or `undefined` if the admin added a new entry. */
  originalEntry: Entry | undefined;
  entryKey: keyof Entry;
  /** The currently displayed (copy) value for this entry's field — used to detect this specific sub-field changed. */
  currentValue: string;
  /** Unique key identifying this exact field for peekedFields/toggle, e.g. "sections.0.title". */
  peekKey: string;
  peekedFields: Set<string>;
  onToggle: () => void;
  copy: {
    peekShowOriginal: string;
    peekShowSuggestion: string;
    noContent: string;
  };
}

/**
 * Builds the `FieldPeek` for one field inside one entry of a diffed array
 * (e.g. `sections[i].title`, `faq[i].question`). `changedFields` only flags
 * the whole array/column as changed, so eligibility additionally requires
 * this specific sub-field's value to differ from the original entry's
 * value. Returns `undefined` when the array wasn't changed, the entry has
 * no original counterpart (admin added it), or this specific sub-field
 * matches. Blog analogue of `resolveEntryPeek`.
 */
export function resolveBlogEntryPeek<Entry>({
  diffKey,
  changedFieldSet,
  originalEntry,
  entryKey,
  currentValue,
  peekKey,
  peekedFields,
  onToggle,
  copy,
}: ResolveBlogEntryPeekArgs<Entry>): FieldPeek | undefined {
  if (!changedFieldSet?.has(diffKey) || !originalEntry) return undefined;

  const originalValue = String(originalEntry[entryKey] ?? "");
  if (originalValue === currentValue) return undefined;

  return {
    originalValue,
    active: peekedFields.has(peekKey),
    onToggle,
    tooltip: {
      showOriginal: copy.peekShowOriginal,
      showSuggestion: copy.peekShowSuggestion,
    },
    emptyLabel: copy.noContent,
  };
}
