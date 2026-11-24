"use client";

import { useState } from "react";
import { TravelerTypesStep } from "@/components/app/dashboard/tripper/profile-editor/steps/TravelerTypesStep";
import {
  tripperProfileDraftFixture,
  type ProfileCatalogExampleProps,
} from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import { useProfileFileIntake } from "@/hooks/useProfileFileIntake";

export function ProfileCatalogTravelerTypes({ catalog, copy, locale }: ProfileCatalogExampleProps) {
  const [travelerTypes, setTravelerTypes] = useState(() => {
    const types = tripperProfileDraftFixture(locale).travelerTypes;
    return { ...types, group: { ...types.group, enabled: false } };
  });
  const intakeFile = useProfileFileIntake(copy.toasts);

  return (
    <>
      <GalleryPanel className="bg-ground" title={catalog.panels.stepTravelerTypes}>
        <div className="max-w-3xl">
          <TravelerTypesStep
            copy={copy.travelerTypes}
            onChange={(type, patch) =>
              setTravelerTypes((current) => ({ ...current, [type]: { ...current[type], ...patch } }))
            }
            onImageSelect={async (type, file) => {
              const url = await intakeFile(file, "image");
              if (url) {
                setTravelerTypes((current) => ({ ...current, [type]: { ...current[type], imageUrl: url } }));
              }
            }}
            travelerTypes={travelerTypes}
          />
        </div>
      </GalleryPanel>
      <UsageExample
        code={`<TravelerTypesStep copy={copy.travelerTypes} onChange={patchType} onImageSelect={handleImage} travelerTypes={draft.travelerTypes} />`}
        label={catalog.panels.stepTravelerTypes}
      />
    </>
  );
}
