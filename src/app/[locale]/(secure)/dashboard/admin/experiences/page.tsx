import Section from "@/components/layout/Section";
import { AdminExperiencesPageClient } from "../AdminExperiencesPageClient";
import { dashboardPageMetadata } from "@/lib/dashboard/pageMetadata";

export const generateMetadata = dashboardPageMetadata("/dashboard/admin/experiences");

export default function AdminExperiencesPage() {
  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <AdminExperiencesPageClient />
      </div>
    </Section>
  );
}
