import Section from "@/components/layout/Section";
import { AdminPaymentsPageClient } from "../AdminPaymentsPageClient";
import { dashboardPageMetadata } from "@/lib/dashboard/pageMetadata";

export const generateMetadata = dashboardPageMetadata("/dashboard/admin/payments");

export default function AdminPaymentsPage() {
  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <AdminPaymentsPageClient />
      </div>
    </Section>
  );
}
