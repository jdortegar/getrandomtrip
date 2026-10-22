"use client";

import { useRouter } from "next/navigation";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { hasLocale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { CAMPAIGNS_PATH } from "./campaignApi";
import { CampaignEditorForm } from "./CampaignEditorForm";
import { EmailCampaignsSectionHeader } from "./EmailCampaignsSectionHeader";
import { EmailCampaignsSubnav } from "./EmailCampaignsSubnav";

/** New campaign page: the editor in create mode; opens the detail page once saved. */
export function NewCampaignPageClient() {
  const pageCopy = useDictionary((d) => d.adminPages.emailCampaigns);
  const locale = useLocale();
  const router = useRouter();
  const safeLocale = hasLocale(locale) ? locale : "es";

  return (
    <div className="space-y-10">
      <EmailCampaignsSubnav active="campaigns" copy={pageCopy.tabs} locale={locale} />
      <EmailCampaignsSectionHeader
        eyebrow={pageCopy.editor.newEyebrow}
        heading={pageCopy.editor.newHeading}
      />
      <CampaignEditorForm
        copy={pageCopy.editor}
        dateLocale={safeLocale === "en" ? "en-US" : "es-ES"}
        defaultLocale={safeLocale}
        errorsCopy={pageCopy.errors}
        localeLabels={pageCopy.locales}
        onSaved={(campaign) =>
          router.push(pathForLocale(safeLocale, `${CAMPAIGNS_PATH}/${campaign.id}`))
        }
        segmentsCopy={pageCopy.segments.picker}
      />
    </div>
  );
}
