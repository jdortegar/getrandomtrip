import Section from "@/components/layout/Section";
import { NewCampaignPageClient } from "@/components/app/admin/email-campaigns/NewCampaignPageClient";
import { dashboardPageMetadata } from "@/lib/dashboard/pageMetadata";

export const generateMetadata = dashboardPageMetadata("/dashboard/admin/email-campaigns/new");

export default function AdminNewEmailCampaignPage() {
  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <NewCampaignPageClient />
      </div>
    </Section>
  );
}
