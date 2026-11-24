"use client";

import { useMemo, useState } from "react";
import { ProfileEditorStepNav } from "@/components/app/dashboard/tripper/profile-editor/ProfileEditorStepNav";
import {
  tripperProfileDraftFixture,
  type ProfileCatalogExampleProps,
} from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import {
  buildEmptyTripperProfileDraft,
  getTripperProfileProgress,
} from "@/lib/helpers/tripperProfileEditor";
import { cn } from "@/lib/utils";
import type { TripperProfileStepId } from "@/types/tripper";

export function ProfileCatalogProgress({ catalog, copy, locale }: ProfileCatalogExampleProps) {
  const [startStep, setStartStep] = useState<TripperProfileStepId>("identity");
  const [doneStep, setDoneStep] = useState<TripperProfileStepId>("media");
  const emptyProgress = useMemo(() => getTripperProfileProgress(buildEmptyTripperProfileDraft()), []);
  const doneProgress = useMemo(
    () => getTripperProfileProgress(tripperProfileDraftFixture(locale)),
    [locale],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className={cn("grid grid-cols-1 gap-6", "md:grid-cols-2")}>
        <GalleryPanel className="min-w-0" title={catalog.panels.navStart}>
          <div className="max-w-[260px]">
            <ProfileEditorStepNav activeStep={startStep} copy={copy.nav} onSelect={setStartStep} progress={emptyProgress} />
          </div>
        </GalleryPanel>
        <GalleryPanel className="min-w-0" title={catalog.panels.navDone}>
          <div className="max-w-[260px]">
            <ProfileEditorStepNav activeStep={doneStep} copy={copy.nav} onSelect={setDoneStep} progress={doneProgress} />
          </div>
        </GalleryPanel>
      </div>
      <UsageExample
        code={`<ProfileEditorStepNav activeStep={activeStep} copy={copy.nav} onSelect={goToStep} progress={getTripperProfileProgress(draft)} />`}
        label={catalog.panels.navStart}
      />
    </div>
  );
}
