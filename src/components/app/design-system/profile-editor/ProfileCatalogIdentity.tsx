"use client";

import { useState } from "react";
import { IdentityStep } from "@/components/app/dashboard/tripper/profile-editor/steps/IdentityStep";
import {
  tripperProfileDraftFixture,
  type ProfileCatalogExampleProps,
} from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import { useProfileFileIntake } from "@/hooks/useProfileFileIntake";

export function ProfileCatalogIdentity({ catalog, copy, locale }: ProfileCatalogExampleProps) {
  const [identity, setIdentity] = useState(() => tripperProfileDraftFixture(locale).identity);
  const intakeFile = useProfileFileIntake(copy.toasts);

  return (
    <>
      <GalleryPanel className="bg-ground" title={catalog.panels.stepIdentity}>
        <div className="max-w-3xl">
          <IdentityStep
            commonCopy={copy.common}
            copy={copy.identity}
            identity={identity}
            locale={locale}
            onChange={(patch) => setIdentity((current) => ({ ...current, ...patch }))}
            onImageSelect={async (field, file) => {
              const url = await intakeFile(file, "image");
              if (url) setIdentity((current) => ({ ...current, [field]: url }));
            }}
          />
        </div>
      </GalleryPanel>
      <UsageExample
        code={`<IdentityStep commonCopy={copy.common} copy={copy.identity} identity={draft.identity} locale={locale} onChange={patchIdentity} onImageSelect={handleImage} />`}
        label={catalog.panels.stepIdentity}
      />
    </>
  );
}
