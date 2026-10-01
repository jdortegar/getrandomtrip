"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { translateExperiencePieces } from "@/lib/ai/browserTranslator";
import {
  applyExperienceCopy,
  collectExperienceCopy,
  type ExperienceCopyLocale,
} from "@/lib/ai/translateExperienceCopy";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";
import type { ExperienceFormDraft } from "@/types/tripper";

interface TranslateExperienceCopyProps {
  copy: TripperExperiencesDict["form"]["translate"];
  form: ExperienceFormDraft;
  onApply: (update: (current: ExperienceFormDraft) => ExperienceFormDraft) => void;
  onBusyChange: (busy: boolean) => void;
}

type TranslationPhase = "downloading" | "idle" | "translating";

const TARGETS: ExperienceCopyLocale[] = ["en", "es"];

function progressLabel(
  copy: TripperExperiencesDict["form"]["translate"],
  phase: TranslationPhase,
  progress: number | undefined,
): string {
  if (phase === "translating") return copy.translating;
  if (progress == null) return copy.downloading;
  return copy.downloadingProgress.replace("{progress}", String(Math.round(progress)));
}

export function TranslateExperienceCopy({
  copy,
  form,
  onApply,
  onBusyChange,
}: TranslateExperienceCopyProps) {
  const [activeTarget, setActiveTarget] = useState<ExperienceCopyLocale | null>(null);
  const [hasError, setHasError] = useState(false);
  const [phase, setPhase] = useState<TranslationPhase>("idle");
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const busyRef = useRef(false);

  const hasCopy = collectExperienceCopy(form).length > 0;
  const isBusy = phase !== "idle";

  async function handleTranslate(target: ExperienceCopyLocale) {
    const pieces = collectExperienceCopy(form);
    if (pieces.length === 0 || busyRef.current) return;

    busyRef.current = true;
    setActiveTarget(target);
    setHasError(false);
    setPhase("downloading");
    setProgress(undefined);
    onBusyChange(true);

    try {
      const translated = await translateExperiencePieces(
        pieces.map(({ html, text }) => ({ html, text })),
        target,
        (info) => {
          if (info.status === "done" || info.status === "ready" || info.status === "translating") {
            setPhase("translating");
            return;
          }
          setPhase("downloading");
          if (typeof info.progress === "number") setProgress(info.progress);
        },
      );

      onApply((current) =>
        applyExperienceCopy(
          current,
          pieces.map((piece, index) => ({
            ...piece,
            text: translated[index] ?? piece.text,
          })),
        ),
      );
    } catch {
      setHasError(true);
    } finally {
      busyRef.current = false;
      setActiveTarget(null);
      setPhase("idle");
      setProgress(undefined);
      onBusyChange(false);
    }
  }

  return (
    <div
      className="bg-gray-50 border border-gray-200 flex flex-col gap-3 p-4 rounded-xl"
      data-component="TranslateExperienceCopy"
    >
      <div className="flex flex-col gap-1">
        <p className="font-normal text-base text-gray-900">{copy.label}</p>
        <p className="text-neutral-600 text-xs">{copy.hint}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TARGETS.map((target) => {
          const isActive = activeTarget === target;
          const label = target === "en" ? copy.toEnglish : copy.toSpanish;

          return (
            <Button
              aria-busy={isActive}
              disabled={!hasCopy || isBusy}
              key={target}
              onClick={() => void handleTranslate(target)}
              size="sm"
              type="button"
              variant="secondary"
            >
              {isActive ? (
                <>
                  <Loader2 aria-hidden className="animate-spin h-4 w-4" />
                  {progressLabel(copy, phase, progress)}
                </>
              ) : (
                label
              )}
            </Button>
          );
        })}
      </div>

      {isBusy ? (
        <p aria-live="polite" className="sr-only">
          {progressLabel(copy, phase, progress)}
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
