"use client";

import { useState } from "react";
import { ProfileEditorSubmitModal } from "@/components/app/dashboard/tripper/profile-editor/ProfileEditorSubmitModal";
import type { ProfileCatalogExampleProps } from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import { Button } from "@/components/ui/Button";

/** Long enough to see the pending spinner and label. */
const DEMO_SUBMIT_MS = 1200;

export function ProfileCatalogReview({ catalog, copy }: ProfileCatalogExampleProps) {
  const [isOpen, setIsOpen] = useState(false);

  async function handleConfirm() {
    await new Promise((resolve) => setTimeout(resolve, DEMO_SUBMIT_MS));
    setIsOpen(false);
  }

  return (
    <>
      <GalleryPanel title={catalog.panels.submitModal}>
        <Button onClick={() => setIsOpen(true)} size="md" type="button">
          {catalog.openModal}
        </Button>
        <ProfileEditorSubmitModal
          copy={copy.submitModal}
          onConfirm={handleConfirm}
          onOpenChange={setIsOpen}
          open={isOpen}
        />
      </GalleryPanel>
      <UsageExample
        code={`<ProfileEditorSubmitModal copy={copy.submitModal} onConfirm={submitForReview} onOpenChange={setOpen} open={open} />`}
        label={catalog.panels.submitModal}
      />
    </>
  );
}
