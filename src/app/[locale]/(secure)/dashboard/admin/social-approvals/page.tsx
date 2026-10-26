import Section from "@/components/layout/Section";
import { InstagramImportForm } from "@/components/app/admin/social-approvals/InstagramImportForm";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { dashboardPageMetadata } from "@/lib/dashboard/pageMetadata";
export const generateMetadata = dashboardPageMetadata(
  "/dashboard/admin/social-approvals",
);
export default async function SocialApprovalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <InstagramImportForm copy={dict.socialImport} />
      </div>
    </Section>
  );
}
