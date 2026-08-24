"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useUserStore } from "@/store/slices/userStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { ImageEditorResult } from "@/components/ui/ImageEditorModal";
import type { ImageEditorDict } from "@/lib/types/dictionary";

// Dynamic-imported at module scope so react-easy-crop is never in the
// initial bundle of a page that renders this — only fetched once opened.
const ImageEditorModal = dynamic(
  () => import("@/components/ui/ImageEditorModal").then((m) => m.ImageEditorModal),
  { ssr: false },
);

export interface AvatarEditorToastCopy {
  avatarFileTooLarge: string;
  avatarUploadError: string;
  avatarUploadSuccess: string;
}

interface AvatarEditorProps {
  imageEditorCopy: ImageEditorDict;
  showStatus?: boolean;
  size: number;
  toastCopy: AvatarEditorToastCopy;
}

/** Self-contained avatar + upload/crop modal. Reads and writes the avatar
 * only through the global user store and NextAuth session, so it drops in
 * anywhere with no parent-supplied profile data — the same instance backs
 * both the account settings overview and the tripper hero. */
export function AvatarEditor({
  imageEditorCopy,
  showStatus = false,
  size,
  toastCopy,
}: AvatarEditorProps) {
  const { data: session, update: updateSession } = useSession();
  const { user } = useUserStore();
  const [uploading, setUploading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  async function handleEditorSave(result: ImageEditorResult) {
    if (result.file && result.file.size > 5 * 1024 * 1024) {
      toast.error(toastCopy.avatarFileTooLarge);
      return;
    }
    setUploading(true);
    try {
      const oldAvatarUrl = user?.avatar;
      const formData = new FormData();
      if (result.file) formData.append("file", result.file);
      formData.append("feature", "avatar");
      formData.append("crop", JSON.stringify(result.crop));
      if (!result.file && result.originalUrl) {
        formData.append(
          "originalKey",
          result.originalUrl.replace(/^\/api\/upload\//, ""),
        );
      }
      const uploadRes = await fetch("/api/upload", {
        body: formData,
        method: "POST",
      });
      if (!uploadRes.ok) {
        toast.error(toastCopy.avatarUploadError);
        return;
      }
      const { url, originalUrl } = (await uploadRes.json()) as {
        originalUrl?: string;
        url?: string;
      };
      if (!url) {
        toast.error(toastCopy.avatarUploadError);
        return;
      }
      const updateRes = await fetch("/api/user/update", {
        body: JSON.stringify({
          avatarUrl: url,
          ...(originalUrl ? { avatarUrlOriginal: originalUrl } : {}),
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!updateRes.ok) {
        toast.error(toastCopy.avatarUploadError);
        return;
      }
      await updateSession({ ...session, user: { ...session?.user, image: url } });
      useUserStore.setState((s) => ({
        user: s.user ? { ...s.user, avatar: url } : s.user,
      }));
      // Delete old baked blob (fire-and-forget) — the original is retained
      // for lossless re-crop, never deleted here.
      if (oldAvatarUrl?.includes("/api/upload")) {
        void fetch(oldAvatarUrl, { method: "DELETE" }).catch(() => null);
      }
      toast.success(toastCopy.avatarUploadSuccess);
      setEditorOpen(false);
    } catch {
      toast.error(toastCopy.avatarUploadError);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <UserAvatar
        height={size}
        onClick={() => setEditorOpen(true)}
        showStatus={showStatus}
        uploading={uploading}
        width={size}
      />
      {editorOpen && (
        <ImageEditorModal
          aspect={1}
          copy={imageEditorCopy}
          maskShape="round"
          onOpenChange={setEditorOpen}
          onSave={handleEditorSave}
          open={editorOpen}
          saving={uploading}
          source={{ originalUrl: user?.avatarUrlOriginal ?? user?.avatar ?? undefined }}
        />
      )}
    </>
  );
}
