"use client";

import { useState } from "react";
import { Mail, Megaphone, Users } from "lucide-react";
import { TabSelector } from "@/components/ui/TabSelector";
import { useDictionary } from "@/hooks/useDictionary";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { AdminUsersPageClient } from "./AdminUsersPageClient";
import { AdminWaitlistPageClient } from "./AdminWaitlistPageClient";
import { AdminXsedNotificationsPageClient } from "./AdminXsedNotificationsPageClient";

type SettingsTabId = "users" | "waitlist" | "xsedNotifications";

interface AdminSettingsPageClientProps {
  copy: MarketingDictionary["adminUsers"];
}

export function AdminSettingsPageClient({
  copy,
}: AdminSettingsPageClientProps) {
  const pageCopy = useDictionary((d) => d.adminPages.settings);
  const [activeTab, setActiveTab] = useState<SettingsTabId>("users");

  const tabs = [
    { icon: Users, id: "users" as const, label: pageCopy.tabs.users },
    { icon: Mail, id: "waitlist" as const, label: pageCopy.tabs.waitlist },
    {
      icon: Megaphone,
      id: "xsedNotifications" as const,
      label: pageCopy.tabs.xsedNotifications,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
          {pageCopy.eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
          {pageCopy.heading}
        </h2>
      </div>

      <TabSelector
        activeTab={activeTab}
        layoutId="adminSettingsActiveTab"
        onTabChange={(tab) => setActiveTab(tab as SettingsTabId)}
        tabs={tabs}
        variant="inline"
      />

      {activeTab === "users" && <AdminUsersPageClient copy={copy} />}
      {activeTab === "waitlist" && <AdminWaitlistPageClient />}
      {activeTab === "xsedNotifications" && (
        <AdminXsedNotificationsPageClient />
      )}
    </div>
  );
}
