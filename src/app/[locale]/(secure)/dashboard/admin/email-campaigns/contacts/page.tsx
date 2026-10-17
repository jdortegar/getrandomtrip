import Section from "@/components/layout/Section";
import { ContactsPageClient } from "@/components/app/admin/email-campaigns/ContactsPageClient";
import { dashboardPageMetadata } from "@/lib/dashboard/pageMetadata";

export const generateMetadata = dashboardPageMetadata(
  "/dashboard/admin/email-campaigns/contacts",
);

export default function AdminEmailCampaignContactsPage() {
  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <ContactsPageClient />
      </div>
    </Section>
  );
}
