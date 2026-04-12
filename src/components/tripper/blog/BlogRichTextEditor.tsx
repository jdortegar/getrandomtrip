"use client";

import { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import type { RawEditorOptions } from "tinymce";

type TinyInitBase = Omit<
  Partial<RawEditorOptions>,
  "disabled" | "license_key" | "readonly" | "selector" | "target"
>;

/**
 * Self-hosted TinyMCE per Tiny docs: load the editor from /public/tinymce via
 * tinymceScriptSrc so themes, skins, and plugins resolve (bundling only tinymce
 * with webpack often breaks the toolbar chrome while the iframe still works).
 * @see https://www.tiny.cloud/docs/tinymce/8/react-pm/
 * @see https://www.tiny.cloud/docs/tinymce/8/react-ref/
 */
const TINYMCE_SCRIPT_SRC = "/tinymce/tinymce.min.js";

const EDITOR_INIT: TinyInitBase = {
  automatic_uploads: true,
  autoresize_bottom_margin: 16,
  autoresize_min_height: 220,
  block_formats: "Paragraph=p; Heading 1=h1; Heading 2=h2",
  branding: false,
  content_style:
    "body.mce-content-body { color: #262626; font-family: Barlow, ui-sans-serif, system-ui, sans-serif; font-size: 1rem; }",
  menubar: false,
  min_height: 280,
  paste_data_images: true,
  plugins: "autoresize code image link lists",
  promotion: false,
  resize: true,
  toolbar:
    "undo redo | blocks | bold italic underline strikethrough | bullist numlist | blockquote link image | removeformat | code",
  toolbar_location: "top",
  toolbar_mode: "wrap",
  toolbar_sticky: false,
  width: "100%",
};

interface BlogRichTextEditorProps {
  "aria-label": string;
  id?: string;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<string>;
  placeholder: string;
  value: string;
}

export function BlogRichTextEditor({
  "aria-label": ariaLabel,
  id,
  onChange,
  onUploadImage,
  placeholder,
  value,
}: BlogRichTextEditorProps) {
  const uploadRef = useRef(onUploadImage);
  uploadRef.current = onUploadImage;

  const editorId = id ?? "blog-rich-text-editor";

  return (
    <div
      aria-label={ariaLabel}
      className="bg-white blog-rich-text border border-neutral-200 min-h-0 min-w-0 relative rounded-lg w-full"
    >
      <Editor
        apiKey="no-api-key"
        id={editorId}
        init={{
          ...EDITOR_INIT,
          images_upload_handler: async (blobInfo, progress) => {
            void progress;
            const blob = blobInfo.blob();
            const file = new File([blob], blobInfo.filename(), {
              type: blob.type || "application/octet-stream",
            });
            return uploadRef.current(file);
          },
          placeholder,
        }}
        licenseKey="gpl"
        onEditorChange={(html) => {
          onChange(html);
        }}
        tinymceScriptSrc={TINYMCE_SCRIPT_SRC}
        value={value}
      />
    </div>
  );
}
