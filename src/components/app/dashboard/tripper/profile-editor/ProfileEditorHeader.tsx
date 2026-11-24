"use client";

import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { TripperProfileEditorDict } from "@/lib/types/dictionary";

interface ProfileEditorHeaderProps {
  canSubmit: boolean;
  copy: TripperProfileEditorDict["header"];
  onPreview: () => void;
  onSubmit: () => void;
}

/** Editorial page intro with the Preview and Submit-for-review actions. */
export function ProfileEditorHeader({ canSubmit, copy, onPreview, onSubmit }: ProfileEditorHeaderProps) {
  return (
    <header
      className={cn("flex flex-col gap-6", "md:flex-row md:items-end md:justify-between")}
      data-component="ProfileEditorHeader"
    >
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{copy.eyebrow}</p>
        <h1 className="mt-3 font-barlow-condensed text-4xl font-bold leading-[0.95] text-ink sm:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-3 text-base text-neutral-600">{copy.subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onPreview} size="md" type="button" variant="secondary">
          {copy.previewCta}
          <ArrowUpRight aria-hidden />
        </Button>
        <Button disabled={!canSubmit} onClick={onSubmit} size="md" type="button">
          {copy.submitCta}
          <ArrowUpRight aria-hidden />
        </Button>
      </div>
    </header>
  );
}
