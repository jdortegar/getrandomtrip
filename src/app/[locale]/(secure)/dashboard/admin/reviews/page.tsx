import Section from "@/components/layout/Section";
import { AdminReviewsPageClient } from "../AdminReviewsPageClient";
import { dashboardPageMetadata } from "@/lib/dashboard/pageMetadata";

export const generateMetadata = dashboardPageMetadata("/dashboard/admin/reviews");

export default function AdminReviewsPage() {
  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <AdminReviewsPageClient />
      </div>
    </Section>
  );
}
