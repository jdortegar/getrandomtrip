"use client";

import Chip from "@/components/Chip";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import { PanelCard } from "@/components/common/PanelCard";
import {
  TRIPPER_PROFILE_BIO_MIN_LENGTH,
  TRIPPER_PROFILE_MAX_AFFINITIES,
  TRIPPER_PROFILE_TEXT_LIMITS,
} from "@/lib/constants/TRIPPER_PROFILE_LIMITS";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import {
  TRIPPER_PROFILE_AFFINITIES,
  toggleAffinity,
} from "@/lib/helpers/tripperProfileEditor";
import type { TripperProfileEditorDict } from "@/lib/types/dictionary";
import type { TripperProfileBio } from "@/types/tripper";

interface PerspectiveStepProps {
  bio: TripperProfileBio;
  commonCopy: TripperProfileEditorDict["common"];
  copy: TripperProfileEditorDict["perspective"];
  onChange: (patch: Partial<TripperProfileBio>) => void;
}

const LIMITS = TRIPPER_PROFILE_TEXT_LIMITS;

export function PerspectiveStep({ bio, commonCopy, copy, onChange }: PerspectiveStepProps) {
  const isBodyShort = bio.body.trim().length < TRIPPER_PROFILE_BIO_MIN_LENGTH;
  const isAtMax = bio.affinities.length >= TRIPPER_PROFILE_MAX_AFFINITIES;

  return (
    <div className="flex flex-col gap-6" data-component="PerspectiveStep">
      <PanelCard meta={commonCopy.requiredHint} title={copy.cardTitle}>
        <TextAreaInput
          className="min-h-[96px]"
          hint={copy.bioTitle.hint}
          id="profile-bio-title"
          label={copy.bioTitle.label}
          maxLength={LIMITS.bioTitle}
          onChange={(e) => onChange({ title: e.target.value })}
          value={bio.title}
        />
        <TextAreaInput
          className="min-h-[96px]"
          hint={copy.bioLead.hint}
          id="profile-bio-lead"
          label={copy.bioLead.label}
          maxLength={LIMITS.bioLead}
          onChange={(e) => onChange({ lead: e.target.value })}
          value={bio.lead}
        />
        <TextAreaInput
          className="min-h-[200px]"
          hint={
            <>
              <span className="block">{copy.bioBody.hint}</span>
              <span className={isBodyShort ? "block text-amber-800" : "block"}>
                {interpolateTemplate(copy.bioBody.minHint, {
                  min: String(TRIPPER_PROFILE_BIO_MIN_LENGTH),
                })}
              </span>
            </>
          }
          id="profile-bio-body"
          label={copy.bioBody.label}
          maxLength={LIMITS.bioBody}
          onChange={(e) => onChange({ body: e.target.value })}
          value={bio.body}
        />
        <TextAreaInput
          className="min-h-[140px]"
          hint={copy.bioMore.hint}
          id="profile-bio-more"
          label={copy.bioMore.label}
          maxLength={LIMITS.bioMore}
          onChange={(e) => onChange({ more: e.target.value })}
          value={bio.more}
        />
      </PanelCard>

      <PanelCard meta={copy.affinitiesMeta} title={copy.affinitiesTitle}>
        <p className="-mt-3 text-sm text-neutral-600">{copy.affinitiesHint}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={copy.affinitiesTitle}>
          {TRIPPER_PROFILE_AFFINITIES.map((affinity) => {
            const isSelected = bio.affinities.includes(affinity);
            return (
              <Chip
                active={isSelected}
                disabled={!isSelected && isAtMax}
                key={affinity}
                onClick={() => onChange({ affinities: toggleAffinity(bio.affinities, affinity) })}
                size="touch"
              >
                {copy.affinityOptions[affinity]}
              </Chip>
            );
          })}
        </div>
      </PanelCard>
    </div>
  );
}
