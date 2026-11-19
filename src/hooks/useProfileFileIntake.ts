"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  TRIPPER_PROFILE_IMAGE_MIME_TYPES,
  TRIPPER_PROFILE_MAX_IMAGE_BYTES,
  TRIPPER_PROFILE_MAX_VIDEO_BYTES,
  TRIPPER_PROFILE_VIDEO_MIME_TYPES,
} from "@/lib/constants/TRIPPER_PROFILE_LIMITS";

export type ProfileFileKind = "image" | "video";

interface ProfileFileIntakeCopy {
  fileTooLarge: string;
  invalidFileType: string;
  uploadFailed: string;
}

const RULES: Record<ProfileFileKind, { maxBytes: number; mimeTypes: string[] }> = {
  image: {
    maxBytes: TRIPPER_PROFILE_MAX_IMAGE_BYTES,
    mimeTypes: TRIPPER_PROFILE_IMAGE_MIME_TYPES.split(","),
  },
  video: {
    maxBytes: TRIPPER_PROFILE_MAX_VIDEO_BYTES,
    mimeTypes: TRIPPER_PROFILE_VIDEO_MIME_TYPES.split(","),
  },
};

/** The file's kind by MIME type, or null when the editor doesn't accept it. */
export function profileFileKind(file: File): ProfileFileKind | null {
  if (RULES.image.mimeTypes.includes(file.type)) return "image";
  if (RULES.video.mimeTypes.includes(file.type)) return "video";
  return null;
}

/**
 * Validates profile-editor files (type + size) and turns them into URLs.
 *
 * `upload` stores the file and returns its URL. When omitted, files become
 * local object-URL previews — revoked on unmount — so the editor UI works
 * before the profile media storage exists.
 */
export function useProfileFileIntake(
  copy: ProfileFileIntakeCopy,
  upload?: (file: File, kind: ProfileFileKind) => Promise<string>,
) {
  const localUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = localUrlsRef.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  return useCallback(
    async (file: File, kind: ProfileFileKind): Promise<string | null> => {
      const rule = RULES[kind];
      if (!rule.mimeTypes.includes(file.type)) {
        toast.error(copy.invalidFileType);
        return null;
      }
      if (file.size > rule.maxBytes) {
        toast.error(copy.fileTooLarge);
        return null;
      }
      try {
        if (upload) return await upload(file, kind);
        const url = URL.createObjectURL(file);
        localUrlsRef.current.push(url);
        return url;
      } catch {
        toast.error(copy.uploadFailed);
        return null;
      }
    },
    [copy.fileTooLarge, copy.invalidFileType, copy.uploadFailed, upload],
  );
}
