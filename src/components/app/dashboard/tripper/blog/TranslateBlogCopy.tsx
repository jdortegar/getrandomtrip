"use client";

import { useRef, useState, type ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { requestCopyTranslation } from "@/lib/ai/requestCopyTranslation";
import {
  applyBlogCopy,
  collectBlogCopy,
  copyBlogMediaFromLocale,
} from "@/lib/ai/translateBlogCopy";
import { type ExperienceCopyLocale } from "@/lib/ai/translateExperienceCopy";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import type { BlogEditorDraft } from "@/types/blog";

interface TranslateBlogCopyProps {
  canSave?: boolean;
  copy: TripperBlogFormDict["translate"];
  draft: BlogEditorDraft;
  languageSlot?: ReactNode;
  isSaving?: boolean;
  locale: ExperienceCopyLocale;
  onApply: (update: (current: BlogEditorDraft) => BlogEditorDraft) => void;
  onBusyChange: (busy: boolean) => void;
  onSave?: () => void;
  onTranslated: (locale: ExperienceCopyLocale) => void;
  saveLabel?: string;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  savedLabel?: string;
  savingLabel?: string;
  showActions?: boolean;
}

export function TranslateBlogCopy({
  canSave = false,
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
  saveStatus = "idle",
  savedLabel,
  savingLabel,
  showActions = true,
}: TranslateBlogCopyProps) {
  const [hasError, setHasError] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const busyRef = useRef(false);
  const sourceLocale: ExperienceCopyLocale = locale === "en" ? "es" : "en";
  const sourceLabel = sourceLocale === "en" ? copy.fromEnglish : copy.fromSpanish;
  const hasSourceCopy = collectBlogCopy(draft, sourceLocale).length > 0;

  async function handleTranslate() {
    const pieces = collectBlogCopy(draft, sourceLocale);
    if (pieces.length === 0 || busyRef.current) return;

    busyRef.current = true;
    setHasError(false);
    setIsTranslating(true);
    onBusyChange(true);

    try {
      const translated = await requestCopyTranslation(
        pieces.map(({ html, text }) => ({ html, text })),
        locale,
      );

      onApply((current) =>
        applyBlogCopy(
          current,
          locale,
          pieces.map((piece, index) => ({
            ...piece,
            text: translated[index] ?? piece.text,
          })),
          sourceLocale,
        ),
      );
      onTranslated(locale);
    } catch {
      onApply((current) => copyBlogMediaFromLocale(current, locale, sourceLocale));
      setHasError(true);
    } finally {
      busyRef.current = false;
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
            <Button
              aria-busy={isTranslating}
              disabled={!hasSourceCopy || isTranslating || isSaving}
              onClick={() => void handleTranslate()}
              size="sm"
              type="button"
              variant="secondary"
            >
              {isTranslating ? (
                <>
                  <Loader2 aria-hidden className="animate-spin h-4 w-4" />
                  {copy.translating}
                </>
              ) : (
                sourceLabel
              )}
            </Button>
            {onSave && saveLabel && savingLabel ? (
              <Button
                aria-busy={isSaving}
                aria-live="polite"
                disabled={!canSave || isSaving || isTranslating}
                onClick={onSave}
                size="sm"
                type="button"
              >
                {isSaving ? (
                  <>
                    <Loader2 aria-hidden className="animate-spin h-4 w-4" />
                    {savingLabel}
                  </>
                ) : saveStatus === "saved" && savedLabel && !canSave ? (
                  <>
                    <Check aria-hidden className="h-4 text-green-500 w-4" />
                    {savedLabel}
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
