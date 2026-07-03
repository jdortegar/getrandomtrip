import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared opt-in "peek at original" contract for `FormField` and `TextAreaInput`.
 *
 * When provided, the input renders a toggle that swaps the DISPLAYED value
 * between the admin's suggested value (the field's live `value`) and the
 * tripper's pristine original (`originalValue`). Purely a display swap —
 * never mutates the underlying form state.
 */
export interface FieldPeek {
  /** Pristine tripper value, pre-admin-edit. Empty string if none. */
  originalValue: string;
  /** true = currently showing the original value; false = showing the admin's suggestion. */
  active: boolean;
  /** Toggles `active`. Owned by the caller (e.g. `ExperienceFormContent`). */
  onToggle: () => void;
  tooltip: {
    /** Tooltip shown while displaying the admin's suggestion (EyeOff icon). */
    showOriginal: string;
    /** Tooltip shown while displaying the tripper's original (Eye icon). */
    showSuggestion: string;
  };
  /** Localized placeholder shown when the original value is an empty string. */
  emptyLabel: string;
}

/**
 * Resolves the value/placeholder swap shared by `FormField` and `TextAreaInput`.
 * Pure display logic — never mutates the underlying form state.
 */
export function resolvePeekDisplay<Value extends string | number | readonly string[] | undefined>(
  peek: FieldPeek | undefined,
  value: Value,
): { displayValue: Value | string; isEmpty: boolean } {
  const isEmpty = !!peek?.active && peek.originalValue.trim() === "";
  const displayValue = peek?.active ? peek.originalValue : value;
  return { displayValue, isEmpty };
}

const PEEK_TOOLTIP_BASE =
  "pointer-events-none absolute z-20 whitespace-nowrap rounded-[4px] bg-gray-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100";

const PEEK_ARROW_BASE = "absolute border-4 border-transparent border-t-gray-900";

export interface PeekToggleButtonProps {
  peek: FieldPeek;
  /**
   * Positions the button+tooltip as an absolute overlay relative to the
   * input's `relative` wrapper. Used by `FormField` (`input`) and by
   * `TextAreaInput`/`RichTextInput` (`textarea`) — the latter with an
   * explicit z-index so it paints above content a third-party widget like
   * TinyMCE injects outside React's render order.
   */
  position: "input" | "textarea";
}

/**
 * Shared toggle button + CSS group-hover tooltip pill (mirrors the
 * `TableIconButton` pattern) used by `FormField` and `TextAreaInput`.
 * Icons are deliberately inverted vs. the password-field convention:
 * `EyeOff` = showing the admin's suggestion (default), `Eye` = showing
 * the tripper's original.
 */
export function PeekToggleButton({ peek, position }: PeekToggleButtonProps) {
  const wrapperClass =
    position === "input"
      ? "group absolute right-4 top-1/2 -translate-y-1/2 z-10"
      : "group absolute right-3 top-3 z-10";
  const tooltipClass =
    position === "input"
      ? cn(PEEK_TOOLTIP_BASE, "bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2")
      : cn(PEEK_TOOLTIP_BASE, "bottom-[calc(100%+6px)] right-0");
  const arrowClass =
    position === "input"
      ? cn(PEEK_ARROW_BASE, "left-1/2 top-full -translate-x-1/2")
      : cn(PEEK_ARROW_BASE, "right-3 top-full");

  return (
    <span className={wrapperClass}>
      {/*
        Not a native <button>: this toggle lives inside the review-copy
        screen's `<fieldset disabled>` (ExperienceFormContent.tsx), which per
        the HTML spec disables every descendant button/input/select/textarea
        regardless of its own disabled state. A <button> here would be
        unclickable. It's a display-only toggle, not a form control, so a
        role="button" span is correct, not a workaround.
      */}
      <span
        aria-label={peek.active ? peek.tooltip.showSuggestion : peek.tooltip.showOriginal}
        className="cursor-pointer text-neutral-400 transition-colors hover:text-neutral-700"
        onClick={peek.onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            peek.onToggle();
          }
        }}
        role="button"
        tabIndex={0}
      >
        {peek.active ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
      </span>
      <div className={tooltipClass}>
        {peek.active ? peek.tooltip.showSuggestion : peek.tooltip.showOriginal}
        <span className={arrowClass} />
      </div>
    </span>
  );
}
