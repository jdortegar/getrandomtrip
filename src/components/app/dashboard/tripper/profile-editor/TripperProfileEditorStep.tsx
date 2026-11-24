"use client";

import { toast } from "sonner";
import { AtlasStep } from "@/components/app/dashboard/tripper/profile-editor/steps/AtlasStep";
import { IdentityStep } from "@/components/app/dashboard/tripper/profile-editor/steps/IdentityStep";
import { MediaStep } from "@/components/app/dashboard/tripper/profile-editor/steps/MediaStep";
import { PerspectiveStep } from "@/components/app/dashboard/tripper/profile-editor/steps/PerspectiveStep";
import { StoriesStep } from "@/components/app/dashboard/tripper/profile-editor/steps/StoriesStep";
import { TravelerTypesStep } from "@/components/app/dashboard/tripper/profile-editor/steps/TravelerTypesStep";
import { profileFileKind, type ProfileFileKind } from "@/hooks/useProfileFileIntake";
import { TRIPPER_PROFILE_MAX_GALLERY_ITEMS } from "@/lib/constants/TRIPPER_PROFILE_LIMITS";
import { createProfileItemId } from "@/lib/helpers/tripperProfileEditor";
import type { TripperProfileEditorDict } from "@/lib/types/dictionary";
import type {
  TripperProfileDraft,
  TripperProfileGalleryItem,
  TripperProfileStepId,
  TripperProfileStoryOption,
} from "@/types/tripper";

interface TripperProfileEditorStepProps {
  blogHref: string;
  copy: TripperProfileEditorDict;
  draft: TripperProfileDraft;
  intakeFile: (file: File, kind: ProfileFileKind) => Promise<string | null>;
  locale: string;
  onPreview: () => void;
  step: TripperProfileStepId;
  stories: TripperProfileStoryOption[];
  updateDraft: (updater: (current: TripperProfileDraft) => TripperProfileDraft) => void;
}

/** Renders the active step and maps its edits onto the draft. */
export function TripperProfileEditorStep({
  blogHref,
  copy,
  draft,
  intakeFile,
  locale,
  onPreview,
  step,
  stories,
  updateDraft,
}: TripperProfileEditorStepProps) {
  async function handleAddGalleryFiles(files: File[]) {
    const slots = TRIPPER_PROFILE_MAX_GALLERY_ITEMS - draft.media.gallery.length;
    if (files.length > slots) toast.info(copy.toasts.galleryFull);
    const added: TripperProfileGalleryItem[] = [];
    for (const file of files.slice(0, Math.max(0, slots))) {
      const kind = profileFileKind(file) ?? "image";
      const url = await intakeFile(file, kind);
      if (!url) continue;
      added.push({
        caption: "",
        id: createProfileItemId("gallery"),
        kind: kind === "video" ? "video" : "photo",
        url,
      });
    }
    if (added.length === 0) return;
    updateDraft((current) => ({
      ...current,
      media: {
        ...current.media,
        gallery: [...current.media.gallery, ...added].slice(0, TRIPPER_PROFILE_MAX_GALLERY_ITEMS),
      },
    }));
  }

  switch (step) {
    case "identity":
      return (
        <IdentityStep
          commonCopy={copy.common}
          copy={copy.identity}
          identity={draft.identity}
          locale={locale}
          onChange={(patch) =>
            updateDraft((current) => ({ ...current, identity: { ...current.identity, ...patch } }))
          }
          onImageSelect={async (field, file) => {
            const url = await intakeFile(file, "image");
            if (url) {
              updateDraft((current) => ({ ...current, identity: { ...current.identity, [field]: url } }));
            }
          }}
        />
      );
    case "perspective":
      return (
        <PerspectiveStep
          bio={draft.bio}
          commonCopy={copy.common}
          copy={copy.perspective}
          onChange={(patch) => updateDraft((current) => ({ ...current, bio: { ...current.bio, ...patch } }))}
        />
      );
    case "travelerTypes":
      return (
        <TravelerTypesStep
          copy={copy.travelerTypes}
          onChange={(type, patch) =>
            updateDraft((current) => ({
              ...current,
              travelerTypes: {
                ...current.travelerTypes,
                [type]: { ...current.travelerTypes[type], ...patch },
              },
            }))
          }
          onImageSelect={async (type, file) => {
            const url = await intakeFile(file, "image");
            if (!url) return;
            updateDraft((current) => ({
              ...current,
              travelerTypes: {
                ...current.travelerTypes,
                [type]: { ...current.travelerTypes[type], imageUrl: url },
              },
            }));
          }}
          travelerTypes={draft.travelerTypes}
        />
      );
    case "atlas":
      return (
        <AtlasStep
          commonCopy={copy.common}
          copy={copy.atlas}
          locale={locale}
          onChange={(places) => updateDraft((current) => ({ ...current, places }))}
          places={draft.places}
          stories={stories}
        />
      );
    case "media":
      return (
        <MediaStep
          commonCopy={copy.common}
          copy={copy.media}
          media={draft.media}
          onAddGalleryFiles={(files) => void handleAddGalleryFiles(files)}
          onChange={(patch) => updateDraft((current) => ({ ...current, media: { ...current.media, ...patch } }))}
          onFile={intakeFile}
          onItemChange={(id, patch) =>
            updateDraft((current) => ({
              ...current,
              media: {
                ...current.media,
                items: current.media.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
              },
            }))
          }
        />
      );
    case "stories":
      return (
        <StoriesStep
          blogHref={blogHref}
          copy={copy.stories}
          featuredIds={draft.featuredStoryIds}
          onChange={(featuredStoryIds) => updateDraft((current) => ({ ...current, featuredStoryIds }))}
          onPreview={onPreview}
          stories={stories}
        />
      );
  }
}
