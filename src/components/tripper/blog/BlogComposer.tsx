"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";
import Img from "@/components/common/Img";
import { BlogComposerSidebar } from "@/components/tripper/blog/BlogComposerSidebar";
import { Button } from "@/components/ui/Button";
import type { BlogPost } from "@/types/blog";
import type { TripperBlogComposerDict } from "@/lib/types/dictionary";

const BlogRichTextEditor = dynamic(
  () =>
    import("@/components/tripper/blog/BlogRichTextEditor").then((m) => ({
      default: m.BlogRichTextEditor,
    })),
  {
    loading: () => (
      <div className="min-h-[280px] rounded-lg border border-dashed border-neutral-200 bg-neutral-50" />
    ),
    ssr: false,
  },
);

interface BlogComposerProps {
  copy: TripperBlogComposerDict;
  mode: "create" | "edit";
  post: Partial<BlogPost>;
}

async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/tripper/blog-media", {
    body: formData,
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("upload failed");
  }
  const data = (await response.json()) as { location?: string };
  if (!data.location) {
    throw new Error("no location");
  }
  return data.location;
}

export default function BlogComposer({
  copy,
  mode,
  post: initialPost,
}: BlogComposerProps) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [post, setPost] = useState<Partial<BlogPost>>({
    ...initialPost,
    blocks: initialPost.blocks ?? [],
    content: initialPost.content ?? "",
    tags: initialPost.tags ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [format, setFormat] = useState<BlogPost["format"]>(
    initialPost.format ?? "article",
  );
  const [tags, setTags] = useState<string[]>(initialPost.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  const contentHtml = typeof post.content === "string" ? post.content : "";

  const handleUploadImage = async (file: File) => {
    try {
      return await uploadImageFile(file);
    } catch {
      toast.error(copy.toasts.uploadError);
      throw new Error("upload failed");
    }
  };

  const handleCoverFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setCoverUploading(true);
    try {
      const url = await uploadImageFile(file);
      setPost((p) => ({ ...p, coverUrl: url }));
    } catch {
      toast.error(copy.toasts.uploadError);
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSave = async () => {
    if (!post.title?.trim()) {
      toast.error(copy.toasts.titleRequired);
      return;
    }

    setSaving(true);
    try {
      const postData = {
        ...post,
        blocks: [] as BlogPost["blocks"],
        content: contentHtml,
        coverUrl: post.coverUrl,
        excuseKey: post.excuseKey?.trim() ? post.excuseKey.trim() : null,
        format,
        status: "draft" as const,
        tags,
        travelType: post.travelType?.trim() ? post.travelType.trim() : null,
      };

      if (mode === "create") {
        const response = await fetch("/api/tripper/blogs", {
          body: JSON.stringify(postData),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        if (response.ok) {
          const data = (await response.json()) as { blog: { id: string } };
          toast.success(copy.toasts.saveSuccessCreate);
          router.push(`/dashboard/tripper/blogs/${data.blog.id}`);
        } else {
          const error = (await response.json()) as { error?: string };
          toast.error(error.error ?? copy.toasts.saveError);
        }
      } else {
        const response = await fetch(`/api/tripper/blogs/${post.id}`, {
          body: JSON.stringify(postData),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });

        if (response.ok) {
          toast.success(copy.toasts.saveSuccessEdit);
        } else {
          const error = (await response.json()) as { error?: string };
          toast.error(error.error ?? copy.toasts.saveError);
        }
      }
    } catch {
      toast.error(copy.toasts.genericSaveError);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!post.title?.trim()) {
      toast.error(copy.toasts.titleRequired);
      return;
    }

    setPublishing(true);
    try {
      const postData = {
        ...post,
        blocks: [] as BlogPost["blocks"],
        content: contentHtml,
        coverUrl: post.coverUrl,
        excuseKey: post.excuseKey?.trim() ? post.excuseKey.trim() : null,
        format,
        publishedAt: new Date().toISOString(),
        status: "published" as const,
        tags,
        travelType: post.travelType?.trim() ? post.travelType.trim() : null,
      };

      if (mode === "create") {
        const response = await fetch("/api/tripper/blogs", {
          body: JSON.stringify(postData),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        if (response.ok) {
          const data = (await response.json()) as { blog: { id: string } };
          toast.success(copy.toasts.publishSuccess);
          router.push(`/dashboard/tripper/blogs/${data.blog.id}`);
        } else {
          const error = (await response.json()) as { error?: string };
          toast.error(error.error ?? copy.toasts.publishError);
        }
      } else {
        const response = await fetch(`/api/tripper/blogs/${post.id}`, {
          body: JSON.stringify(postData),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });

        if (response.ok) {
          toast.success(copy.toasts.publishSuccess);
        } else {
          const error = (await response.json()) as { error?: string };
          toast.error(error.error ?? copy.toasts.publishError);
        }
      }
    } catch {
      toast.error(copy.toasts.genericPublishError);
    } finally {
      setPublishing(false);
    }
  };

  const addTag = () => {
    const next = tagInput.trim();
    if (next && !tags.includes(next)) {
      setTags([...tags, next]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const breadcrumb =
    mode === "create" ? copy.breadcrumbCreate : copy.breadcrumbEdit;

  const statusLine = saving
    ? copy.saving
    : publishing
      ? copy.publishing
      : copy.unsaved;

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-6">
        <div className="bg-white border-b border-neutral-200 pb-4 space-y-4 sticky top-0 z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-500">{breadcrumb}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-neutral-500">{statusLine}</span>
              <Button
                disabled={publishing || saving}
                onClick={handleSave}
                size="sm"
                type="button"
                variant="secondary"
              >
                <Save className="h-4 w-4" />
                {copy.save}
              </Button>
            </div>
          </div>
          <input
            className="w-full border-none bg-transparent font-barlow-condensed text-3xl font-bold text-neutral-900 outline-none md:text-4xl"
            onChange={(e) => setPost({ ...post, title: e.target.value })}
            placeholder={copy.titlePlaceholder}
            type="text"
            value={post.title ?? ""}
          />
          <input
            className="w-full border-none bg-transparent text-xl font-semibold text-neutral-800 outline-none"
            onChange={(e) => setPost({ ...post, subtitle: e.target.value })}
            placeholder={copy.subtitlePlaceholder}
            type="text"
            value={post.subtitle ?? ""}
          />
        </div>

        <div className="bg-white border border-gray-200 p-6 relative rounded-xl shadow-sm space-y-6">
          <div>
            <h3 className="mb-2 text-lg font-semibold text-neutral-900">
              {copy.cover.title}
            </h3>
            <p className="mb-3 text-sm text-neutral-600">{copy.cover.hint}</p>
            <div className="flex flex-col gap-3">
              <input
                accept="image/*"
                className="hidden"
                onChange={handleCoverFileChange}
                ref={coverInputRef}
                type="file"
              />
              {post.coverUrl ? (
                <>
                  <div className="border border-neutral-200 h-40 max-w-md mx-auto overflow-hidden relative rounded-lg w-full">
                    <Img
                      alt={copy.cover.previewAlt}
                      className="h-full w-full object-cover"
                      height={320}
                      sizes="(max-width: 768px) 100vw, 448px"
                      src={post.coverUrl}
                      width={448}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 items-center justify-center">
                    <Button
                      disabled={coverUploading}
                      onClick={() => coverInputRef.current?.click()}
                      type="button"
                      variant="secondary"
                    >
                      {coverUploading ? copy.cover.uploading : copy.cover.upload}
                    </Button>
                    <Button
                      onClick={() =>
                        setPost((p) => ({ ...p, coverUrl: undefined }))
                      }
                      type="button"
                      variant="ghost"
                    >
                      {copy.cover.remove}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    disabled={coverUploading}
                    onClick={() => coverInputRef.current?.click()}
                    type="button"
                    variant="secondary"
                  >
                    {coverUploading ? copy.cover.uploading : copy.cover.upload}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-neutral-500"
              htmlFor="blog-composer-body"
            >
              {copy.bodyLabel}
            </label>
            <BlogRichTextEditor
              aria-label={copy.bodyLabel}
              id="blog-composer-body"
              onChange={(html) => setPost({ ...post, content: html })}
              onUploadImage={handleUploadImage}
              placeholder={copy.bodyPlaceholder}
              value={contentHtml}
            />
          </div>
        </div>
      </div>

      <BlogComposerSidebar
        copy={copy}
        excuseKey={post.excuseKey ?? ""}
        format={format}
        onAddTag={addTag}
        onExcuseKeyChange={(value) =>
          setPost((p) => ({
            ...p,
            excuseKey: value.length > 0 ? value : undefined,
          }))
        }
        onFormatChange={setFormat}
        onPreview={() => {
          if (!post.id) return;
          router.push(`/dashboard/tripper/blogs/${post.id}/preview`);
        }}
        onPublish={handlePublish}
        onRemoveTag={removeTag}
        onTagInputChange={setTagInput}
        onTravelTypeChange={(value) =>
          setPost((p) => ({
            ...p,
            travelType: value.length > 0 ? value : undefined,
          }))
        }
        postId={post.id}
        postStatus={post.status}
        publishing={publishing}
        saving={saving}
        tagInput={tagInput}
        tags={tags}
        travelType={post.travelType ?? ""}
      />
    </div>
  );
}
