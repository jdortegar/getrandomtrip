"use client";

import { useState } from "react";
import { PerspectiveStep } from "@/components/app/dashboard/tripper/profile-editor/steps/PerspectiveStep";
import {
  tripperProfileDraftFixture,
  type ProfileCatalogExampleProps,
} from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";

export function ProfileCatalogPerspective({ catalog, copy, locale }: ProfileCatalogExampleProps) {
  const [bio, setBio] = useState(() => tripperProfileDraftFixture(locale).bio);

  return (
    <>
      <GalleryPanel className="bg-ground" title={catalog.panels.stepPerspective}>
        <div className="max-w-3xl">
          <PerspectiveStep
            bio={bio}
            commonCopy={copy.common}
            copy={copy.perspective}
            onChange={(patch) => setBio((current) => ({ ...current, ...patch }))}
          />
        </div>
      </GalleryPanel>
      <UsageExample
        code={`<PerspectiveStep bio={draft.bio} commonCopy={copy.common} copy={copy.perspective} onChange={patchBio} />`}
        label={catalog.panels.stepPerspective}
      />
    </>
  );
}
