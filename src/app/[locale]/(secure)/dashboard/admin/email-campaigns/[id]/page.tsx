import Section from "@/components/layout/Section";
import { CampaignDetailPageClient } from "@/components/app/admin/email-campaigns/CampaignDetailPageClient";
import { dashboardPageMetadata } from "@/lib/dashboard/pageMetadata";

export const generateMetadata = dashboardPageMetadata("/dashboard/admin/email-campaigns/x");

export default async function AdminEmailCampaignDetailPage(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await props.params;
  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <CampaignDetailPageClient campaignId={id} />
      </div>
    </Section>
  );
}
