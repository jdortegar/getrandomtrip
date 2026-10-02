"use client";

import { useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { requestCopyTranslation } from "@/lib/ai/requestCopyTranslation";
import {
  applyBlogCopy,
  collectBlogCopy,
} from "@/lib/ai/translateBlogCopy";
import {
  sourceLocaleFor,
  type ExperienceCopyLocale,
} from "@/lib/ai/translateExperienceCopy";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import type { BlogFormDraft } from "@/types/blog";

interface TranslateBlogCopyProps {
  copy: TripperBlogFormDict["translate"];
  draft: BlogFormDraft;
  languageSlot?: ReactNode;
  isSaving?: boolean;
  locale: ExperienceCopyLocale;
  onApply: (update: (current: BlogFormDraft) => BlogFormDraft) => void;
  onBusyChange: (busy: boolean) => void;
  onSave?: () => void;
  onTranslated: (locale: ExperienceCopyLocale) => void;
  saveLabel?: string;
  savingLabel?: string;
  showActions?: boolean;
}

const TARGETS: ExperienceCopyLocale[] = ["en", "es"];

export function TranslateBlogCopy({
  copy,
  draft,
  isSaving = false,
  languageSlot,
  locale,
  onApply,
  onBusyChange,
  onSave,
  onTranslated,
  saveLabel,
  savingLabel,
  showActions = true,
}: TranslateBlogCopyProps) {
  const [activeTarget, setActiveTarget] = useState<ExperienceCopyLocale | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const busyRef = useRef(false);

  async function handleTranslate(target: ExperienceCopyLocale) {
    const pieces = collectBlogCopy(draft, sourceLocaleFor(target));
    if (target === locale || pieces.length === 0 || busyRef.current) return;

    busyRef.current = true;
    setActiveTarget(target);
    setHasError(false);
    setIsTranslating(true);
    onBusyChange(true);

    try {
      const translated = await requestCopyTranslation(
        pieces.map(({ html, text }) => ({ html, text })),
        target,
      );

      onApply((current) =>
        applyBlogCopy(
          current,
          target,
          pieces.map((piece, index) => ({
            ...piece,
            text: translated[index] ?? piece.text,
          })),
        ),
      );
      onTranslated(target);
    } catch {
      setHasError(true);
    } finally {
      busyRef.current = false;
      setActiveTarget(null);
      setIsTranslating(false);
      onBusyChange(false);
    }
  }

  return (
    <div
      className="bg-gray-50 border border-gray-200 flex flex-col gap-3 p-4 rounded-xl"
      data-component="TranslateBlogCopy"
    >
      <div
        className="flex flex-wrap gap-3 items-center"
        data-component="BlogLocaleRow"
      >
        {languageSlot}
        {showActions ? (
          <div className="flex flex-wrap gap-2">
            {TARGETS.map((target) => {
              const isActive = activeTarget === target;
              const label = target === "en" ? copy.toEnglish : copy.toSpanish;
              const hasCopy = collectBlogCopy(draft, sourceLocaleFor(target)).length > 0;
              const isSameLanguage = target === locale;

              return (
                <Button
                  aria-busy={isActive}
                  disabled={isSameLanguage || !hasCopy || isTranslating || isSaving}
                  key={target}
                  onClick={() => void handleTranslate(target)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {isActive ? (
                    <>
                      <Loader2 aria-hidden className="animate-spin h-4 w-4" />
                      {copy.translating}
                    </>
                  ) : (
                    label
                  )}
                </Button>
              );
            })}
            {onSave && saveLabel && savingLabel ? (
              <Button
                aria-busy={isSaving}
                disabled={isTranslating || isSaving}
                onClick={onSave}
                size="sm"
                type="button"
              >
                {isSaving ? (
                  <>
                    <Loader2 aria-hidden className="animate-spin h-4 w-4" />
                    {savingLabel}
                  </>
                ) : (
                  saveLabel
                )}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      {showActions ? (
        <p className="text-neutral-600 text-xs">{copy.hint}</p>
      ) : null}

      {isTranslating ? (
        <p aria-live="polite" className="sr-only">
          {copy.translating}
        </p>
      ) : null}

      {hasError ? (
        <p className="text-red-600 text-sm" role="alert">
          {copy.error}
        </p>
      ) : null}
    </div>
  );
}
