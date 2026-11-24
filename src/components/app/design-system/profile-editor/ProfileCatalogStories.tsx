"use client";

import { useState } from "react";
import { StoriesStep } from "@/components/app/dashboard/tripper/profile-editor/steps/StoriesStep";
import {
  tripperProfileStoriesFixture,
  type ProfileCatalogExampleProps,
} from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";

function noop() {}

export function ProfileCatalogStories({ catalog, copy, locale }: ProfileCatalogExampleProps) {
  const [stories] = useState(() => tripperProfileStoriesFixture(locale));
  const [featured, setFeatured] = useState<string[]>(["example-story-1", "example-story-2"]);
  const [emptyFeatured, setEmptyFeatured] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-6">
      <GalleryPanel className="bg-ground" title={catalog.panels.stepStories}>
        <div className="max-w-3xl">
          <StoriesStep
            blogHref="#"
            copy={copy.stories}
            featuredIds={featured}
            onChange={setFeatured}
            onPreview={noop}
            stories={stories}
          />
        </div>
      </GalleryPanel>
      <GalleryPanel className="bg-ground" title={catalog.panels.storiesEmpty}>
        <div className="max-w-3xl">
          <StoriesStep
            blogHref="#"
            copy={copy.stories}
            featuredIds={emptyFeatured}
            onChange={setEmptyFeatured}
            onPreview={noop}
            stories={[]}
          />
        </div>
      </GalleryPanel>
      <UsageExample
        code={`<StoriesStep blogHref={blogHref} copy={copy.stories} featuredIds={draft.featuredStoryIds} onChange={setFeatured} onPreview={handlePreview} stories={stories} />`}
        label={catalog.panels.stepStories}
      />
    </div>
  );
}
