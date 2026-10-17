"use client";

import { AlertTriangle } from "lucide-react";
import type { BlogMediaMismatch } from "@/types/blog";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";

interface BlogMediaMismatchWarningProps {
  copy: TripperBlogFormDict["mediaMismatch"];
  mismatch: BlogMediaMismatch;
}

export function BlogMediaMismatchWarning({
  copy,
  mismatch,
}: BlogMediaMismatchWarningProps) {
  if (!mismatch.missing.length && !mismatch.extra.length) return null;

  return (
    <div
      className="bg-amber-50 border border-amber-200 flex gap-3 p-3 rounded-xl text-amber-800 text-sm"
      data-component="BlogMediaMismatchWarning"
      role="status"
    >
      <AlertTriangle aria-hidden className="h-4 mt-0.5 shrink-0 text-amber-500 w-4" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{copy.title}</p>
        {mismatch.missing.length ? (
          <p>
            {copy.missing}: {mismatch.missing.join(", ")}
          </p>
        ) : null}
        {mismatch.extra.length ? (
          <p>
            {copy.extra}: {mismatch.extra.join(", ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
