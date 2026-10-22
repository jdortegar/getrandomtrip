"use client";

import { Layers, Megaphone, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { TabSelector } from "@/components/ui/TabSelector";
import { hasLocale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import type { EmailCampaignsAdminView } from "@/types/emailCampaign";

const VIEW_PATHS: Record<EmailCampaignsAdminView, string> = {
  campaigns: "/dashboard/admin/email-campaigns",
  contacts: "/dashboard/admin/email-campaigns/contacts",
  segments: "/dashboard/admin/email-campaigns/segments",
};

interface EmailCampaignsSubnavProps {
  active: EmailCampaignsAdminView;
  copy: EmailCampaignsAdminDict["tabs"];
  locale: string;
}

/** Secondary navigation between the campaigns, contacts and segments pages. */
export function EmailCampaignsSubnav({
  active,
  copy,
  locale,
}: EmailCampaignsSubnavProps) {
  const router = useRouter();
  const safeLocale = hasLocale(locale) ? locale : "es";

  return (
    <TabSelector
      activeTab={active}
      layoutId="adminEmailCampaignsActiveTab"
      onTabChange={(tab) => {
        if (tab === active) return;
        router.push(
          pathForLocale(safeLocale, VIEW_PATHS[tab as EmailCampaignsAdminView]),
        );
      }}
      tabs={[
        { icon: Megaphone, id: "campaigns", label: copy.campaigns },
        { icon: Users, id: "contacts", label: copy.contacts },
        { icon: Layers, id: "segments", label: copy.segments },
      ]}
      variant="inline"
    />
  );
}
