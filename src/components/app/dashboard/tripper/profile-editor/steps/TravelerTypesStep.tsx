"use client";

import { ArrowUpRight } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import { ProfileImagePicker } from "@/components/app/dashboard/tripper/profile-editor/ProfileImagePicker";
import { TRIPPER_PROFILE_TEXT_LIMITS } from "@/lib/constants/TRIPPER_PROFILE_LIMITS";
import { TRIPPER_PROFILE_TRAVELER_TYPES } from "@/lib/helpers/tripperProfileEditor";
import { cn } from "@/lib/utils";
import type { TripperProfileEditorDict } from "@/lib/types/dictionary";
import type {
  TripperProfileDraft,
  TripperProfileTravelerType,
  TripperProfileTravelerTypeCard,
} from "@/types/tripper";

interface TravelerTypesStepProps {
  copy: TripperProfileEditorDict["travelerTypes"];
  onChange: (type: TripperProfileTravelerType, patch: Partial<TripperProfileTravelerTypeCard>) => void;
  onImageSelect: (type: TripperProfileTravelerType, file: File) => void;
  travelerTypes: TripperProfileDraft["travelerTypes"];
}

export function TravelerTypesStep({
  copy,
  onChange,
  onImageSelect,
  travelerTypes,
}: TravelerTypesStepProps) {
  return (
    <div className="flex flex-col gap-6" data-component="TravelerTypesStep">
      <p className="flex items-start gap-3 rounded-xl border border-secondary bg-secondary/15 px-4 py-3 text-sm text-ink">
        <ArrowUpRight aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        {copy.scopeNote}
      </p>

      {TRIPPER_PROFILE_TRAVELER_TYPES.map((type) => {
        const card = travelerTypes[type];
        const typeCopy = copy.types[type];
        const switchId = `profile-type-${type}-enabled`;

        return (
          <section
            aria-labelledby={`profile-type-${type}-title`}
            className={cn(
              "flex flex-col gap-5 rounded-2xl bg-white p-5 shadow-sm ring-1 transition-colors",
              "sm:p-6",
              card.enabled ? "ring-primary/40" : "ring-gray-200",
            )}
            key={type}
          >
            <header className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  {typeCopy.product}
                </p>
                <h3
                  className="font-barlow-condensed text-2xl font-bold uppercase leading-none text-ink"
                  id={`profile-type-${type}-title`}
                >
                  {typeCopy.label}
                </h3>
              </div>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-neutral-700" htmlFor={switchId}>
                {copy.show}
                <Switch
                  checked={card.enabled}
                  id={switchId}
                  onCheckedChange={(enabled) => onChange(type, { enabled })}
                />
              </label>
            </header>

            {card.enabled ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-[180px_1fr]">
                <ProfileImagePicker
                  alt={typeCopy.label}
                  aspectClassName="aspect-[4/5]"
                  changeLabel={copy.image.upload}
                  hint={copy.image.hint}
                  id={`profile-type-${type}-image`}
                  onSelect={(file) => onImageSelect(type, file)}
                  uploadLabel={copy.image.upload}
                  value={card.imageUrl}
                />
                <TextAreaInput
                  className="min-h-[120px]"
                  hint={copy.text.hint}
                  id={`profile-type-${type}-text`}
                  label={copy.text.label}
                  maxLength={TRIPPER_PROFILE_TEXT_LIMITS.travelerTypeText}
                  onChange={(e) => onChange(type, { text: e.target.value })}
                  value={card.text}
                />
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
