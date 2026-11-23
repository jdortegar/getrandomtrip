"use client";

import { ProfileEditorAside } from "@/components/app/dashboard/tripper/profile-editor/ProfileEditorAside";
import { PanelCard } from "@/components/common/PanelCard";
import { ProfileEditorFooterNav } from "@/components/app/dashboard/tripper/profile-editor/ProfileEditorFooterNav";
import { ProfileEditorStepHeader } from "@/components/app/dashboard/tripper/profile-editor/ProfileEditorStepHeader";
import type { ProfileCatalogExampleProps } from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import { TRIPPER_PROFILE_STEPS } from "@/lib/helpers/tripperProfileEditor";
import { cn } from "@/lib/utils";

const FOOTER_CASES = [
  { index: 0, panel: "footerFirst" },
  { index: 2, panel: "footerMiddle" },
  { index: TRIPPER_PROFILE_STEPS.length - 1, panel: "footerLast" },
] as const;

function noop() {}

export function ProfileCatalogStructure({ catalog, copy }: ProfileCatalogExampleProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className={cn("grid grid-cols-1 gap-6", "lg:grid-cols-2")}>
        <GalleryPanel className="min-w-0 bg-ground" title={catalog.panels.stepHeaderEssential}>
          <ProfileEditorStepHeader
            badge={copy.stepBadges.essential}
            eyebrow={copy.identity.eyebrow}
            lead={copy.identity.lead}
            title={copy.identity.title}
          />
        </GalleryPanel>
        <GalleryPanel className="min-w-0 bg-ground" title={catalog.panels.stepHeaderOptional}>
          <ProfileEditorStepHeader
            badge={copy.stepBadges.optional}
            eyebrow={copy.media.eyebrow}
            lead={copy.media.lead}
            title={copy.media.title}
          />
        </GalleryPanel>
        <GalleryPanel className="min-w-0 bg-ground" title={catalog.panels.card}>
          <PanelCard meta={copy.common.requiredHint} title={copy.identity.presentationTitle}>
            <p className="text-sm text-neutral-600">{catalog.sampleCardBody}</p>
          </PanelCard>
        </GalleryPanel>
        <GalleryPanel className="min-w-0 bg-ground" title={catalog.panels.aside}>
          <div className="max-w-[260px]">
            <ProfileEditorAside activeStep="media" copy={copy.aside} />
          </div>
        </GalleryPanel>
      </div>
      {FOOTER_CASES.map(({ index, panel }) => (
        <GalleryPanel className="bg-ground" key={panel} title={catalog.panels[panel]}>
          <ProfileEditorFooterNav
            activeStep={TRIPPER_PROFILE_STEPS[index]!.id}
            copy={copy.footer}
            isLastStep={index === TRIPPER_PROFILE_STEPS.length - 1}
            onNext={noop}
            onPrevious={noop}
            stepIndex={index}
            totalSteps={TRIPPER_PROFILE_STEPS.length}
          />
        </GalleryPanel>
      ))}
      <UsageExample
        code={`<ProfileEditorStepHeader badge={copy.stepBadges.essential} eyebrow={copy.identity.eyebrow} lead={copy.identity.lead} title={copy.identity.title} />
<PanelCard meta={copy.common.requiredHint} title={copy.identity.presentationTitle}>…</PanelCard>
<ProfileEditorFooterNav activeStep="identity" copy={copy.footer} isLastStep={false} onNext={next} onPrevious={back} stepIndex={0} totalSteps={6} />`}
        label={catalog.panels.card}
      />
    </div>
  );
}
