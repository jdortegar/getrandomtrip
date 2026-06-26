"use client";

import type { ReactNode } from "react";
import { Editor } from "@tinymce/tinymce-react";
import type { RawEditorOptions } from "tinymce";

type TinyInitBase = Omit<
  Partial<RawEditorOptions>,
  "disabled" | "license_key" | "readonly" | "selector" | "target"
>;

const TINYMCE_SCRIPT_SRC = "/tinymce/tinymce.min.js";

const EDITOR_INIT: TinyInitBase = {
  autoresize_bottom_margin: 16,
  autoresize_min_height: 200,
  branding: false,
  content_style:
    "@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&display=swap'); .mce-content-body { background: #f3f4f6; color: #1a1a1a; font-family: 'Barlow', ui-sans-serif, system-ui, sans-serif; font-size: 16px; font-weight: 400; line-height: 1.5; margin: 0; padding: 16px 24px !important; } .mce-content-body p { margin: 0; } .mce-content-body[data-mce-placeholder]::before { font-size: 16px; line-height: 1.5; left: 24px !important; top: 16px !important; }",
  menubar: false,
  plugins: "autoresize lists",
  promotion: false,
  resize: false,
  toolbar: "bold italic | bullist numlist | removeformat",
  toolbar_location: "top",
  toolbar_mode: "wrap",
  width: "100%",
};

interface RichTextInputProps {
  id: string;
  label: ReactNode;
  onChange: (html: string) => void;
  placeholder?: string;
  value: string;
  disabled?: boolean;
}

export function RichTextInput({
  id,
  label,
  onChange,
  placeholder,
  value,
  disabled,
}: RichTextInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="block font-normal text-gray-600 text-base" htmlFor={id}>
        {label}
      </label>
      <div className="rich-text-input bg-gray-100 rounded-xl overflow-hidden min-h-[200px]">
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
    </div>
  );
}
