"use client";

import type { ReactNode } from "react";
import { Editor } from "@tinymce/tinymce-react";
import type { RawEditorOptions } from "tinymce";
import { PeekToggleButton, type FieldPeek } from "./field-peek";
import { cn } from "@/lib/utils";

type TinyInitBase = Omit<
  Partial<RawEditorOptions>,
  "disabled" | "license_key" | "readonly" | "selector" | "target"
>;

const TINYMCE_SCRIPT_SRC = "/tinymce/tinymce.min.js";

const EDITOR_INIT: TinyInitBase = {
  autoresize_bottom_margin: 16,
  branding: false,
  min_height: 200,
  content_style:
    "@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&display=swap'); .mce-content-body { background: #f3f4f6; color: #1a1a1a; font-family: 'Barlow', ui-sans-serif, system-ui, sans-serif; font-size: 16px; font-weight: 400; line-height: 1.5; margin: 0; padding: 16px 24px !important; } .mce-content-body p { margin: 0; } .mce-content-body[data-mce-placeholder]::before { font-size: 16px; line-height: 1.5; left: 24px !important; top: 16px !important; }",
  menubar: false,
  plugins: "autoresize lists",
  promotion: false,
  resize: false,
  toolbar: "bold italic | bullist numlist | blockquote | removeformat",
  toolbar_location: "top",
  toolbar_mode: "wrap",
  toolbar_sticky: true,
  width: "100%",
};

interface RichTextInputProps {
  id: string;
  label: ReactNode;
  onChange: (html: string) => void;
  placeholder?: string;
  value: string;
  disabled?: boolean;
  /** Opt-in "peek at original" toggle. Undefined by default — zero effect on other call sites. */
  peek?: FieldPeek;
  /** Applied to the outer wrapper — e.g. the changed-field amber ring. */
  className?: string;
}

export function RichTextInput({
  id,
  label,
  onChange,
  placeholder,
  value,
  disabled,
  peek,
  className,
}: RichTextInputProps) {
  const isPeeking = !!peek?.active;
  const isEmpty = isPeeking && !peek!.originalValue.trim();

  return (
    <div className="flex flex-col gap-2">
      <label className="block font-normal text-gray-600 text-base" htmlFor={id}>
        {label}
      </label>
      {/*
        The toggle sits in this outer `relative` wrapper — a sibling of
        whichever content renders below, not a descendant of TinyMCE's own
        DOM — with an explicit z-index so it paints above TinyMCE's toolbar
        even though the toolbar (added after mount, outside React's tree)
        would otherwise occupy the same top-right corner without one.
        Rounding/clipping lives on the INNER box, not here — the tooltip pops
        up above the icon, and an `overflow-hidden` on this outer wrapper
        would clip it before it can render.
      */}
      <div className={cn("relative", className)}>
        {isPeeking ? (
          // Static read-only preview of the tripper's original — deliberately
          // NOT fed into the live TinyMCE instance. TinyMCE fires its own
          // change event on programmatic setContent() too (its `changeEvents`
          // list includes 'setcontent'), so swapping the controlled `value` to
          // show the original would make TinyMCE's own React wrapper call
          // `onEditorChange` and silently overwrite the admin's real edit with
          // the original text. A separate static element has no write-back path.
          <div
            className={cn(
              "min-h-[200px] rounded-xl bg-gray-100 px-6 py-4 font-barlow text-base leading-[1.5] text-neutral-400",
              isEmpty ? "italic" : "line-through [&_*]:line-through",
            )}
            dangerouslySetInnerHTML={{ __html: isEmpty ? peek!.emptyLabel : peek!.originalValue }}
          />
        ) : (
          <div
            className={cn(
              "rich-text-input min-h-[200px] rounded-xl bg-gray-100",
              // Clip only the content/iframe area (.tox-edit-area), a sibling
              // of the toolbar (.tox-editor-header) — NOT the .tox-tinymce
              // root. Any overflow-hidden ancestor of the toolbar would
              // disable toolbar_sticky (position: sticky requires every
              // ancestor up to its scroll container to have overflow:
              // visible).
              "[&_.tox-editor-header]:rounded-t-xl",
              "[&_.tox-edit-area]:overflow-hidden [&_.tox-edit-area]:rounded-b-xl",
            )}
          >
            <Editor
              apiKey="no-api-key"
              id={id}
              init={{ ...EDITOR_INIT, placeholder }}
              licenseKey="gpl"
              onEditorChange={onChange}
              tinymceScriptSrc={TINYMCE_SCRIPT_SRC}
              value={value}
              disabled={disabled}
            />
          </div>
        )}
        {peek ? <PeekToggleButton peek={peek} position="textarea" /> : null}
      </div>
    </div>
  );
}
