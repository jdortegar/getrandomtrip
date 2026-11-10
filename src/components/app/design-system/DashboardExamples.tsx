"use client";

import { useState } from "react";
import { DashboardStatsGrid } from "@/components/app/dashboard/DashboardStatsGrid";
import { buildTravelerNavTabs } from "@/components/app/dashboard/config/travelerNav";
import type { DashboardNavTabItem } from "@/components/app/dashboard/config/dashboardNavTypes";
import { DashboardNavTabs } from "@/components/app/dashboard/shell/DashboardNavTabs";
import {
  TripperViewToggle,
  type TripperProfileViewMode,
} from "@/components/app/dashboard/tripper/settings/TripperViewToggle";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { DEFAULT_LOCALE, hasLocale } from "@/lib/i18n/config";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import type { DashboardCopy } from "@/components/app/dashboard/types";

interface DashboardExamplesProps {
  copy: DesignSystemDict;
}

const STATS = {
  averageRating: 4.8,
  completedTrips: 6,
  totalSpent: 4200,
  totalTrips: 8,
  upcomingTrips: 2,
};

function withoutUnread(tabs: DashboardNavTabItem[]) {
  return tabs.map((tab) => ({ ...tab, showUnreadDot: false }));
}

export function DashboardExamples({ copy }: DashboardExamplesProps) {
  const labels = copy.dashboard;
  const localeRaw = useLocale();
  const locale = hasLocale(localeRaw) ? localeRaw : DEFAULT_LOCALE;
  const travelerCopy = useDictionary((d) => d.dashboard);
  const travelerNav = useDictionary((d) => d.travelerDashboard.nav);
  const toggleCopy = useDictionary(
    (d) => d.tripperDashboard.settingsProfile.viewToggle,
  );
  const [view, setView] = useState<TripperProfileViewMode>("tripper");
  const tabs = withoutUnread(buildTravelerNavTabs(travelerNav, locale));

  return (
    <>
      <div className="flex flex-col gap-6">
        <GalleryPanel
          className="bg-neutral-50 max-w-full overflow-x-auto w-fit"
          title={labels.nav}
        >
          <DashboardNavTabs activeHref={tabs[0]?.href} tabs={tabs} />
        </GalleryPanel>
        <GalleryPanel title={labels.kpis}>
          <DashboardStatsGrid
            copy={travelerCopy as DashboardCopy}
            stats={STATS}
          />
        </GalleryPanel>
        <GalleryPanel className="w-fit" title={labels.toggle}>
          <TripperViewToggle
            copy={toggleCopy}
            onChange={setView}
            value={view}
          />
        </GalleryPanel>
      </div>
      <UsageExample
        code={`<DashboardNavTabs tabs={tabs} />
<DashboardStatsGrid copy={copy} stats={stats} />
<TripperViewToggle copy={copy} onChange={setView} value={view} />`}
        label={copy.usage}
      />
    </>
  );
}
