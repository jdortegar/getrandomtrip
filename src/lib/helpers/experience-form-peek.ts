import type { ExperienceFormDraft } from "@/types/tripper";
import type { FieldPeek } from "@/components/ui/field-peek";

export interface ResolveFieldPeekArgs {
  field: string;
  changedFieldSet: Set<string> | null | undefined;
  originalDraft: ExperienceFormDraft | undefined;
  peekedFields: Set<string>;
  onToggle: () => void;
  copy: {
    peekShowOriginal: string;
    peekShowSuggestion: string;
    noContent: string;
  };
}

/**
 * Builds the `FieldPeek` for a single field, or `undefined` when the field is
 * not eligible (not in `changedFieldSet`, or no `originalDraft` to peek at).
 * Pure function — no DOM or client dependencies; toggle state lives in the caller.
 */
export function resolveFieldPeek({
  field,
  changedFieldSet,
  originalDraft,
  peekedFields,
  onToggle,
  copy,
}: ResolveFieldPeekArgs): FieldPeek | undefined {
  if (!changedFieldSet?.has(field) || !originalDraft) return undefined;

  const rawValue = (originalDraft as unknown as Record<string, unknown>)[field];

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

export interface ResolveEntryPeekArgs<Entry> {
  /** Top-level `changedFields` key gating the whole array (e.g. "hotels" for `accommodations`). */
  diffKey: string;
  changedFieldSet: Set<string> | null | undefined;
  /** The original entry at this index, or `undefined` if the admin added a new entry. */
  originalEntry: Entry | undefined;
  entryKey: keyof Entry;
  /** The currently displayed (copy) value for this entry's field — used to detect this specific sub-field changed. */
  currentValue: string;
  /** Unique key identifying this exact field for peekedFields/toggle, e.g. "accommodations.0.hotelName". */
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
 * (e.g. `accommodations[i].hotelName`). `changedFields` only flags the whole
 * array as changed (JSON-diffed), so eligibility additionally requires this
 * specific sub-field's value to differ from the original entry's value.
 * Returns `undefined` when the array wasn't changed, the entry has no
 * original counterpart (admin added it), or this specific sub-field matches.
 */
export function resolveEntryPeek<Entry>({
  diffKey,
  changedFieldSet,
  originalEntry,
  entryKey,
  currentValue,
  peekKey,
  peekedFields,
  onToggle,
  copy,
}: ResolveEntryPeekArgs<Entry>): FieldPeek | undefined {
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
