"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { PanelCard } from "@/components/common/PanelCard";
import { GalleryEditor } from "@/components/app/dashboard/tripper/profile-editor/steps/GalleryEditor";
import { MediaItemEditor } from "@/components/app/dashboard/tripper/profile-editor/steps/MediaItemEditor";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import {
  TRIPPER_PROFILE_MEDIA_PROVIDERS,
  createProfileItemId,
  moveListItem,
} from "@/lib/helpers/tripperProfileEditor";
import type { TripperProfileEditorDict } from "@/lib/types/dictionary";
import type {
  TripperProfileMedia,
  TripperProfileMediaItem,
  TripperProfileMediaProvider,
} from "@/types/tripper";

interface MediaStepProps {
  commonCopy: TripperProfileEditorDict["common"];
  copy: TripperProfileEditorDict["media"];
  media: TripperProfileMedia;
  onAddGalleryFiles: (files: File[]) => void;
  onChange: (patch: Partial<TripperProfileMedia>) => void;
  /** Patches one item against the latest draft (safe after an async upload). */
  onItemChange: (id: string, patch: Partial<TripperProfileMediaItem>) => void;
  /** Validates and stores a file; resolves to its URL, or null when rejected. */
  onFile: (file: File, kind: "image" | "video") => Promise<string | null>;
}

export function MediaStep({
  commonCopy,
  copy,
  media,
  onAddGalleryFiles,
  onChange,
  onFile,
  onItemChange,
}: MediaStepProps) {
  const [provider, setProvider] = useState<TripperProfileMediaProvider>("youtube");
  const [expandedId, setExpandedId] = useState<string | null>(media.items[0]?.id ?? null);

  const items = media.items;

  function handleAdd() {
    const item: TripperProfileMediaItem = {
      id: createProfileItemId("media"),
      isVisible: true,
      posterUrl: "",
      provider,
      title: "",
      url: "",
    };
    onChange({ items: [...items, item] });
    setExpandedId(item.id);
  }

  async function handleFile(id: string, file: File, field: "posterUrl" | "url") {
    const url = await onFile(file, field === "url" ? "video" : "image");
    if (url) onItemChange(id, { [field]: url });
  }

  return (
    <div className="flex flex-col gap-6" data-component="MediaStep">
      <PanelCard
        meta={interpolateTemplate(copy.itemsMeta, { count: String(items.length) })}
        title={copy.itemsTitle}
      >
        <p className="-mt-3 text-sm text-neutral-600">{copy.itemsIntro}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <FormSelectField
              id="media-provider"
              label={copy.addLabel}
              onChange={(e) => setProvider(e.target.value as TripperProfileMediaProvider)}
              value={provider}
            >
              {TRIPPER_PROFILE_MEDIA_PROVIDERS.map((option) => (
                <option key={option} value={option}>
                  {copy.providers[option]}
                </option>
              ))}
            </FormSelectField>
          </div>
          <Button className="min-h-[58px]" onClick={handleAdd} size="md" type="button" variant="secondary">
            {copy.addCta}
            <Plus aria-hidden />
          </Button>
        </div>

        {items.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {items.map((item, index) => (
              <MediaItemEditor
                commonCopy={commonCopy}
                copy={copy.item}
                index={index}
                isExpanded={expandedId === item.id}
                item={item}
                key={item.id}
                onChange={(patch) => onItemChange(item.id, patch)}
                onMove={(direction) => onChange({ items: moveListItem(items, index, direction) })}
                onPosterSelect={(file) => void handleFile(item.id, file, "posterUrl")}
                onRemove={() => onChange({ items: items.filter((other) => other.id !== item.id) })}
                onToggle={() => setExpandedId((current) => (current === item.id ? null : item.id))}
                onVideoSelect={(file) => void handleFile(item.id, file, "url")}
                providerLabel={copy.providers[item.provider]}
                total={items.length}
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-ground px-4 py-6 text-center text-sm text-neutral-500">
            {copy.itemsEmpty}
          </p>
        )}
        <p className="text-xs text-neutral-500">{copy.itemsFootnote}</p>
      </PanelCard>

      <GalleryEditor
        commonCopy={commonCopy}
        copy={copy.gallery}
        items={media.gallery}
        onAddFiles={onAddGalleryFiles}
        onChange={(gallery) => onChange({ gallery })}
      />

      <PanelCard title={copy.otherTitle}>
        <FormField
          id="media-linkedin"
          inputMode="url"
          label={copy.linkedin.label}
          onChange={(e) => onChange({ linkedinUrl: e.target.value })}
          placeholder={copy.linkedin.placeholder}
          type="url"
          value={media.linkedinUrl}
        />
        <FormField
          id="media-website"
          inputMode="url"
          label={copy.website.label}
          onChange={(e) => onChange({ websiteUrl: e.target.value })}
          placeholder={copy.website.placeholder}
          type="url"
          value={media.websiteUrl}
        />
      </PanelCard>
    </div>
  );
}
