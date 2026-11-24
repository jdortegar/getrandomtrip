import { Asterisk, CircleDot } from "lucide-react";
import type { TripperProfileEditorDict } from "@/lib/types/dictionary";
import type { TripperProfileStepId } from "@/types/tripper";

interface ProfileEditorAsideProps {
  activeStep: TripperProfileStepId;
  copy: TripperProfileEditorDict["aside"];
}

/** Desktop side column: a short editorial tip for the active step and the review reminder. */
export function ProfileEditorAside({ activeStep, copy }: ProfileEditorAsideProps) {
  const tip = copy.tips[activeStep];

  return (
    <aside className="flex flex-col gap-8" data-component="ProfileEditorAside">
      <div className="flex flex-col gap-3">
        <Asterisk aria-hidden className="h-6 w-6 text-primary" />
        <h2 className="font-barlow-condensed text-2xl font-bold leading-tight text-ink">{tip.title}</h2>
        <p className="text-sm text-neutral-600">{tip.body}</p>
      </div>
      <div className="flex items-start gap-3 border-t border-gray-200 pt-5">
        <CircleDot aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs text-neutral-600">
          <span className="block font-medium text-primary">{copy.reviewNoteTitle}</span>
          {copy.reviewNoteBody}
        </p>
      </div>
    </aside>
  );
}
