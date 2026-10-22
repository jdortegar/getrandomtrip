"use client";

import { useMemo, useState } from "react";
import { Compass, Map, Star } from "lucide-react";
import { TabSelector } from "@/components/ui/TabSelector";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface TabExamplesProps {
  copy: DesignSystemDict;
}

export function TabExamples({ copy }: TabExamplesProps) {
  const labels = copy.tabs;
  const tabs = useMemo(
    () => [
      { icon: Compass, id: "overview", label: labels.overview },
      { icon: Map, id: "details", label: labels.details },
      { icon: Star, id: "reviews", label: labels.reviews },
    ],
    [labels.details, labels.overview, labels.reviews],
  );
  const [inlineTab, setInlineTab] = useState("overview");
  const [marketingTab, setMarketingTab] = useState("overview");
  const selectedLabel = (id: string) =>
    labels.selected.replace(
      "{tab}",
      tabs.find((tab) => tab.id === id)?.label ?? id,
    );

  return (
    <>
      <div className={cn("gap-6 grid", "lg:grid-cols-2")}>
        <GalleryPanel title={labels.inline}>
          <TabSelector
            activeTab={inlineTab}
            layoutId="gallery-inline-tabs"
            onTabChange={setInlineTab}
            tabs={tabs}
            variant="inline"
          />
          <p className="mt-4 text-neutral-600 text-sm" role="status">
            {selectedLabel(inlineTab)}
          </p>
        </GalleryPanel>
        <GalleryPanel title={labels.marketing}>
          <TabSelector
            activeTab={marketingTab}
            layoutId="gallery-marketing-tabs"
            onTabChange={setMarketingTab}
            tabs={tabs}
            variant="marketing"
          />
          <p className="mt-4 text-neutral-600 text-sm" role="status">
            {selectedLabel(marketingTab)}
          </p>
        </GalleryPanel>
      </div>
      <UsageExample
        code={`<TabSelector activeTab={tab} onTabChange={setTab} tabs={tabs} variant="inline" />`}
        label={copy.usage}
      />
    </>
  );
}
