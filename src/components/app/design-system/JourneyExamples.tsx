"use client";

import { useMemo, useState } from "react";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import ExcuseCard from "@/components/journey/ExcuseCard";
import { JourneyDropdown } from "@/components/journey/JourneyDropdown";
import JourneyProgressSidebar from "@/components/journey/JourneyProgressSidebar";
import { JourneySectionCard } from "@/components/journey/JourneySectionCard";
import RemovableTag from "@/components/RemovableTag";
import { Accordion } from "@/components/ui/accordion";
import { BRAND_BOOK_PHOTOS } from "@/lib/constants/BRAND_BOOK_PHOTOS";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface JourneyExamplesProps {
  copy: DesignSystemDict;
}

const EXCUSE_SLOT = "max-w-full w-[294px]";

export function JourneyExamples({ copy }: JourneyExamplesProps) {
  const labels = copy.journey;
  const [activeTab, setActiveTab] = useState("details");
  const [openDropdown, setOpenDropdown] = useState("who");
  const [sectionOpen, setSectionOpen] = useState(true);
  const [selectedExcuse, setSelectedExcuse] = useState("lunch");
  const [pills, setPills] = useState(["origin", "dates"]);
  const tabs = useMemo(
    () => [
      { id: "budget", label: labels.tabBudget, substeps: [] },
      {
        id: "details",
        label: labels.tabDetails,
        substeps: [
          { description: "", id: "origin", title: labels.subOrigin },
          { description: "", id: "dates", title: labels.subDates },
        ],
      },
      {
        id: "preferences",
        label: labels.tabPreferences,
        substeps: [
          { description: "", id: "filters", title: labels.subFilters },
        ],
      },
    ],
    [
      labels.subDates,
      labels.subFilters,
      labels.subOrigin,
      labels.tabBudget,
      labels.tabDetails,
      labels.tabPreferences,
    ],
  );

  return (
    <>
      <div className={cn("gap-8 grid items-start", "lg:grid-cols-[20rem_minmax(0,1fr)]")}>
        <div>
          <h3 className="font-semibold mb-5 text-xl">{labels.progress}</h3>
          <JourneyProgressSidebar
            activeSubstepId="origin"
            activeTab={activeTab}
            addonsComingSoonLabel={labels.comingSoon}
            completedTabIds={["budget"]}
            completionLabels={{
              completed: labels.completed,
              incomplete: labels.incomplete,
            }}
            onStepClick={setActiveTab}
            progressLabel={labels.progressLabel}
            tabs={tabs}
          />
        </div>
        <div className="flex flex-col gap-8 min-w-0">
          <div>
            <h3 className="font-semibold mb-5 text-xl">{labels.dropdowns}</h3>
            <Accordion
              collapsible
              onValueChange={setOpenDropdown}
              type="single"
              value={openDropdown}
            >
              <JourneyDropdown
                className="mb-4"
                content={labels.dropdownContent}
                label={labels.dropdownLabel}
                value="who"
              >
                <p className="text-neutral-600 text-sm">{labels.dropdownBody}</p>
              </JourneyDropdown>
              <JourneyDropdown
                content={labels.tabDetails}
                label={labels.tabDetails}
                value="details"
              >
                <p className="text-neutral-600 text-sm">{labels.sectionBody}</p>
              </JourneyDropdown>
            </Accordion>
          </div>
          <GalleryPanel title={labels.pills}>
            <div className="flex flex-wrap gap-2">
              {pills.includes("origin") ? (
                <RemovableTag
                  color="primary"
                  item={{
                    key: "origin",
                    onRemove: () =>
                      setPills((current) =>
                        current.filter((pill) => pill !== "origin"),
                      ),
                    value: labels.pillOrigin,
                  }}
                  removeLabel={labels.pillRemove.replace(
                    "{label}",
                    labels.pillOrigin,
                  )}
                />
              ) : null}
              {pills.includes("dates") ? (
                <RemovableTag
                  color="primary"
                  item={{
                    key: "dates",
                    onRemove: () =>
                      setPills((current) =>
                        current.filter((pill) => pill !== "dates"),
                      ),
                    value: labels.pillDates,
                  }}
                  removeLabel={labels.pillRemove.replace(
                    "{label}",
                    labels.pillDates,
                  )}
                />
              ) : null}
              <RemovableTag
                color="primary"
                item={{
                  key: "transport",
                  locked: true,
                  value: labels.pillTransport,
                }}
              />
            </div>
          </GalleryPanel>
          <div>
            <h3 className="font-semibold mb-5 text-xl">{labels.section}</h3>
            <JourneySectionCard
              actionLabel={labels.sectionAction}
              description={labels.sectionDescription}
              isOpen={sectionOpen}
              onToggle={() => setSectionOpen((open) => !open)}
              title={labels.sectionTitle}
            >
              <p className="text-neutral-600 text-sm">{labels.sectionBody}</p>
            </JourneySectionCard>
          </div>
        </div>
      </div>
      <h3 className="font-semibold mb-5 mt-10 text-xl">{labels.excuse}</h3>
      <div
        className={cn(
          "gap-x-8 gap-y-8 grid justify-start",
          "[grid-template-columns:repeat(auto-fill,minmax(min(100%,18.375rem),18.375rem))]",
        )}
      >
        <div className={EXCUSE_SLOT}>
          <ExcuseCard
            ctaLabel={labels.excuseCta}
            description={labels.excuseDescription}
            imageUrl={BRAND_BOOK_PHOTOS.lunchTable}
            onClick={() => setSelectedExcuse("lunch")}
            selected={selectedExcuse === "lunch"}
            title={labels.excuseTitle}
          />
        </div>
        <div className={EXCUSE_SLOT}>
          <ExcuseCard
            ctaLabel={labels.excuseCta}
            description={labels.excuseDescription}
            imageUrl={BRAND_BOOK_PHOTOS.sunsetSwim}
            onClick={() => setSelectedExcuse("swim")}
            selected={selectedExcuse === "swim"}
            title={labels.excuseTitle}
          />
        </div>
      </div>
      <UsageExample
        code={`<JourneyProgressSidebar activeTab={tab} tabs={tabs} />
<JourneyDropdown label={copy.label} value="who">{copy.body}</JourneyDropdown>
<RemovableTag color="primary" item={item} />`}
        label={copy.usage}
      />
    </>
  );
}
