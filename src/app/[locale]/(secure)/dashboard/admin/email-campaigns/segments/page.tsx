import Section from "@/components/layout/Section";
import { SegmentsPageClient } from "@/components/app/admin/email-campaigns/SegmentsPageClient";
import { dashboardPageMetadata } from "@/lib/dashboard/pageMetadata";

export const generateMetadata = dashboardPageMetadata(
  "/dashboard/admin/email-campaigns/segments",
);

export default function AdminEmailCampaignSegmentsPage() {
  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <SegmentsPageClient />
      </div>
    </Section>
  );
}
