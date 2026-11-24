"use client";

import { ProfileEditorHeader } from "@/components/app/dashboard/tripper/profile-editor/ProfileEditorHeader";
import {
  ProfileEditorStatusBar,
  type ProfileSaveState,
} from "@/components/app/dashboard/tripper/profile-editor/ProfileEditorStatusBar";
import type { ProfileCatalogExampleProps } from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import type { TripperProfileStatus } from "@/types/tripper";

const STATUSES: TripperProfileStatus[] = ["DRAFT", "PENDING_REVIEW", "CHANGES_REQUESTED", "APPROVED"];
const SAVE_STATES: ProfileSaveState[] = ["dirty", "saving", "saved"];
/** Built from local date parts so server and browser format the same time. */
const SAVED_AT = new Date(2026, 9, 21, 8, 59);

function noop() {}

export function ProfileCatalogChrome({ catalog, copy, locale }: ProfileCatalogExampleProps) {
  return (
    <div className="flex flex-col gap-6">
      <GalleryPanel title={catalog.panels.headerReady}>
        <ProfileEditorHeader canSubmit copy={copy.header} onPreview={noop} onSubmit={noop} />
      </GalleryPanel>
      <GalleryPanel title={catalog.panels.headerBlocked}>
        <ProfileEditorHeader canSubmit={false} copy={copy.header} onPreview={noop} onSubmit={noop} />
      </GalleryPanel>
      <GalleryPanel title={catalog.panels.statuses}>
        <div className="flex flex-col">
          {STATUSES.map((status) => (
            <ProfileEditorStatusBar
              copy={copy.status}
              key={status}
              locale={locale}
              onSave={noop}
              saveState="clean"
              savedAt={null}
              status={status}
            />
          ))}
        </div>
      </GalleryPanel>
      <GalleryPanel title={catalog.panels.saveStates}>
        <div className="flex flex-col">
          {SAVE_STATES.map((saveState) => (
            <ProfileEditorStatusBar
              copy={copy.status}
              key={saveState}
              locale={locale}
              onSave={noop}
              saveState={saveState}
              savedAt={SAVED_AT}
              status="DRAFT"
            />
          ))}
        </div>
      </GalleryPanel>
      <UsageExample
        code={`<ProfileEditorHeader canSubmit={canSubmit} copy={copy.header} onPreview={handlePreview} onSubmit={openSubmit} />
<ProfileEditorStatusBar copy={copy.status} locale={locale} onSave={handleSave} saveState="dirty" savedAt={savedAt} status="DRAFT" />`}
        label={catalog.panels.statuses}
      />
    </div>
  );
}
