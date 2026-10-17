import { buildBlogSubmitPayload } from "@/lib/helpers/blog-form";
import type { BlogEditorDraft } from "@/types/blog";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import type { BlogPersistTarget } from "./newBlogPostShellHelpers";

export function messageForEditorWriteError(
  body: { error?: string },
  dict: TripperBlogFormDict["errors"],
): string | null {
  switch (body.error) {
    case "invalid_source_locale":
      return dict.invalidSourceLocale;
    case "source_locale_incomplete":
      return dict.sourceLocaleIncomplete;
    case "source_translation_incomplete":
      return dict.sourceTranslationIncomplete;
    default:
      return null;
  }
}

export async function persistBlogEditorDraft(
  draft: BlogEditorDraft,
  target: BlogPersistTarget,
): Promise<{ id?: string; error?: { error?: string } }> {
  const payload = buildBlogSubmitPayload(draft);
  if (target.kind === "adminEditCopy") {
    const res = await fetch(`/api/admin/blogs/${target.copyId}/edit-copy`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { error: body };
    return {};
  }
  if (target.kind === "createDraft") {
    const res = await fetch("/api/tripper/blogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => ({}))) as {
      blog?: { id: string };
      error?: string;
    };
    if (!res.ok) return { error: body };
    return { id: body.blog?.id };
  }
  const res = await fetch(`/api/tripper/blogs/${target.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) return { error: body };
  return {};
}
