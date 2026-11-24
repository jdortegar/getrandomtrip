"use client";

import { useState } from "react";
import { GalleryEditor } from "@/components/app/dashboard/tripper/profile-editor/steps/GalleryEditor";
import { MediaItemEditor } from "@/components/app/dashboard/tripper/profile-editor/steps/MediaItemEditor";
import {
  tripperProfileDraftFixture,
  tripperProfileFullGalleryFixture,
  type ProfileCatalogExampleProps,
} from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import { profileFileKind, useProfileFileIntake } from "@/hooks/useProfileFileIntake";
import { TRIPPER_PROFILE_MAX_GALLERY_ITEMS } from "@/lib/constants/TRIPPER_PROFILE_LIMITS";
import { createProfileItemId } from "@/lib/helpers/tripperProfileEditor";
import type { TripperProfileGalleryItem, TripperProfileMediaItem } from "@/types/tripper";

type MediaCase = "collapsed" | "expanded" | "upload";

function buildMediaCases(base: TripperProfileMediaItem[]): Record<MediaCase, TripperProfileMediaItem> {
  return {
    collapsed: base[0]!,
    expanded: { ...base[1]!, url: "https://www.instagram.com/getrandomtrip.es/" },
    upload: { id: "catalog-upload", isVisible: true, posterUrl: "", provider: "upload", title: "", url: "" },
  };
}

const MEDIA_PANELS = {
  collapsed: "mediaItemCollapsed",
  expanded: "mediaItemExpanded",
  upload: "mediaItemUpload",
} as const;

export function ProfileCatalogMedia({ catalog, copy, locale }: ProfileCatalogExampleProps) {
  const [items, setItems] = useState(() => buildMediaCases(tripperProfileDraftFixture(locale).media.items));
  const [expanded, setExpanded] = useState<Record<MediaCase, boolean>>({
    collapsed: false,
    expanded: true,
    upload: true,
  });
  const [emptyGallery, setEmptyGallery] = useState<TripperProfileGalleryItem[]>([]);
  const [filledGallery, setFilledGallery] = useState(() => tripperProfileDraftFixture(locale).media.gallery);
  const [fullGallery, setFullGallery] = useState(() => tripperProfileFullGalleryFixture(locale));
  const intakeFile = useProfileFileIntake(copy.toasts);

  function patchItem(key: MediaCase, patch: Partial<TripperProfileMediaItem>) {
    setItems((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
  }

  async function addFiles(files: File[], set: (update: (current: TripperProfileGalleryItem[]) => TripperProfileGalleryItem[]) => void) {
    const added: TripperProfileGalleryItem[] = [];
    for (const file of files) {
      const kind = profileFileKind(file) ?? "image";
      const url = await intakeFile(file, kind);
      if (url) added.push({ caption: "", id: createProfileItemId("gallery"), kind: kind === "video" ? "video" : "photo", url });
    }
    set((current) => [...current, ...added].slice(0, TRIPPER_PROFILE_MAX_GALLERY_ITEMS));
  }

  return (
    <div className="flex flex-col gap-6">
      {(Object.keys(MEDIA_PANELS) as MediaCase[]).map((key) => (
        <GalleryPanel key={key} title={catalog.panels[MEDIA_PANELS[key]]}>
          <ul className="max-w-3xl">
            <MediaItemEditor
              commonCopy={copy.common}
              copy={copy.media.item}
              index={0}
              isExpanded={expanded[key]}
              item={items[key]}
              onChange={(patch) => patchItem(key, patch)}
              onMove={() => undefined}
              onPosterSelect={async (file) => {
                const url = await intakeFile(file, "image");
                if (url) patchItem(key, { posterUrl: url });
              }}
              onRemove={() => undefined}
              onToggle={() => setExpanded((current) => ({ ...current, [key]: !current[key] }))}
              onVideoSelect={async (file) => {
                const url = await intakeFile(file, "video");
                if (url) patchItem(key, { url });
              }}
              providerLabel={copy.media.providers[items[key].provider]}
              total={1}
            />
          </ul>
        </GalleryPanel>
      ))}
      {(
        [
          ["galleryEmpty", emptyGallery, setEmptyGallery],
          ["galleryFilled", filledGallery, setFilledGallery],
          ["galleryFull", fullGallery, setFullGallery],
        ] as const
      ).map(([panel, gallery, setGallery]) => (
        <GalleryPanel className="bg-ground" key={panel} title={catalog.panels[panel]}>
          <div className="max-w-3xl">
            <GalleryEditor
              commonCopy={copy.common}
              copy={copy.media.gallery}
              items={gallery}
              onAddFiles={(files) => void addFiles(files, setGallery)}
              onChange={setGallery}
            />
          </div>
        </GalleryPanel>
      ))}
      <UsageExample
        code={`<MediaItemEditor commonCopy={copy.common} copy={copy.media.item} index={i} isExpanded={open} item={item} onChange={patch} onMove={move} onPosterSelect={poster} onRemove={remove} onToggle={toggle} onVideoSelect={video} providerLabel={label} total={items.length} />
<GalleryEditor commonCopy={copy.common} copy={copy.media.gallery} items={gallery} onAddFiles={addFiles} onChange={setGallery} />`}
        label={catalog.panels.galleryFilled}
      />
    </div>
  );
}
