"use client";

import { Lock } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { Accordion } from "@/components/ui/accordion";
import { JourneyDropdown } from "@/components/journey/JourneyDropdown";
import type { AppDictionary } from "@/hooks/useDictionary";

interface Props {
  copy: AppDictionary["adminExperienceReview"];
  lockedByOther: boolean;
  reviewLockedBy?: string | null;
  reviewLockedByName?: string | null;
  nonXsedTypes: string[];
  prices: Record<string, string>;
  onPriceChange: (type: string, value: string) => void;
  saving: boolean;
}

/** Review context — soft-lock banner and per-type pricing. All actions (approve/reject/edit/discard/send) live in AdminReviewActionsBar (sticky top). */
export function AdminReviewSlot({
  copy,
  lockedByOther,
  reviewLockedBy,
  reviewLockedByName,
  nonXsedTypes,
  prices,
  onPriceChange,
  saving,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {lockedByOther && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>{copy.lockedBannerTitle}</strong>{" "}
            {reviewLockedByName ?? reviewLockedBy}. {copy.lockedBannerBody}
          </span>
        </div>
      )}

      {nonXsedTypes.length > 0 && (
        <Accordion type="single" collapsible defaultValue="admin-pricing">
          <JourneyDropdown
            value="admin-pricing"
            label={copy.priceSection}
            content=""
          >
            <div className="space-y-5">
              {nonXsedTypes.map((t) => (
                <FormField
                  key={t}
                  id={`admin-price-${t}`}
                  label={<span className="capitalize">{t}</span>}
                  type="number"
                  min="1"
                  step="any"
                  placeholder="0"
                  value={prices[t] ?? ""}
                  onChange={(e) => onPriceChange(t, e.target.value)}
                  disabled={saving}
                />
              ))}
            </div>
          </JourneyDropdown>
        </Accordion>
      )}
    </div>
  );
}
