import Section from "@/components/layout/Section";
import { CampaignsPageClient } from "@/components/app/admin/email-campaigns/CampaignsPageClient";
import { dashboardPageMetadata } from "@/lib/dashboard/pageMetadata";

export const generateMetadata = dashboardPageMetadata("/dashboard/admin/email-campaigns");

export default function AdminEmailCampaignsPage() {
  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <CampaignsPageClient />
      </div>
    </Section>
  );
}
