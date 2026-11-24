"use client";

import { useState } from "react";
import { ProfileImagePicker } from "@/components/app/dashboard/tripper/profile-editor/ProfileImagePicker";
import { ProfileReorderControls } from "@/components/app/dashboard/tripper/profile-editor/ProfileReorderControls";
import {
  tripperProfileDraftFixture,
  type ProfileCatalogExampleProps,
} from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import { useProfileFileIntake } from "@/hooks/useProfileFileIntake";
import { moveListItem } from "@/lib/helpers/tripperProfileEditor";
import { cn } from "@/lib/utils";

export function ProfileCatalogImageInputs({ catalog, copy, locale }: ProfileCatalogExampleProps) {
  const [fixture] = useState(() => tripperProfileDraftFixture(locale));
  const [empty, setEmpty] = useState("");
  const [portrait, setPortrait] = useState(fixture.identity.portraitUrl);
  const [cover, setCover] = useState(fixture.identity.coverUrl);
  const [items, setItems] = useState(fixture.media.gallery);
  const intakeFile = useProfileFileIntake(copy.toasts);

  async function pick(file: File, set: (url: string) => void) {
    const url = await intakeFile(file, "image");
    if (url) set(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={cn("grid grid-cols-1 gap-6", "md:grid-cols-3")}>
        <GalleryPanel className="min-w-0" title={catalog.panels.imageEmpty}>
          <ProfileImagePicker
            alt=""
            aspectClassName="aspect-[4/5]"
            changeLabel={copy.identity.portrait.change}
            hint={copy.identity.portrait.hint}
            id="catalog-image-empty"
            onSelect={(file) => void pick(file, setEmpty)}
            uploadLabel={copy.identity.portrait.upload}
            value={empty}
          />
        </GalleryPanel>
        <GalleryPanel className="min-w-0" title={catalog.panels.imagePortrait}>
          <ProfileImagePicker
            alt={fixture.identity.name}
            aspectClassName="aspect-[4/5]"
            changeLabel={copy.identity.portrait.change}
            hint={copy.identity.portrait.hint}
            id="catalog-image-portrait"
            onSelect={(file) => void pick(file, setPortrait)}
            uploadLabel={copy.identity.portrait.upload}
            value={portrait}
          />
        </GalleryPanel>
        <GalleryPanel className="min-w-0" title={catalog.panels.imageCover}>
          <ProfileImagePicker
            alt={fixture.identity.coverAlt}
            aspectClassName="aspect-[9/5]"
            changeLabel={copy.identity.cover.change}
            hint={copy.identity.cover.hint}
            id="catalog-image-cover"
            onSelect={(file) => void pick(file, setCover)}
            uploadLabel={copy.identity.cover.upload}
            value={cover}
          />
        </GalleryPanel>
      </div>
      <GalleryPanel title={catalog.panels.reorder}>
        <ol className="divide-y divide-gray-100">
          {items.map((item, index) => (
            <li className="flex items-center justify-between gap-4 py-2" key={item.id}>
              <span className="text-sm text-ink">{item.caption}</span>
              <ProfileReorderControls
                copy={copy.common}
                index={index}
                itemLabel={item.caption}
                onMove={(direction) => setItems((current) => moveListItem(current, index, direction))}
                onRemove={() => setItems((current) => current.filter((other) => other.id !== item.id))}
                total={items.length}
              />
            </li>
          ))}
        </ol>
      </GalleryPanel>
      <UsageExample
        code={`<ProfileImagePicker alt={alt} aspectClassName="aspect-[4/5]" changeLabel={copy.portrait.change} hint={hint} id="portrait" onSelect={handleFile} uploadLabel={copy.portrait.upload} value={url} />
<ProfileReorderControls copy={copy.common} index={index} itemLabel={caption} onMove={move} onRemove={remove} total={items.length} />`}
        label={catalog.panels.reorder}
      />
    </div>
  );
}
