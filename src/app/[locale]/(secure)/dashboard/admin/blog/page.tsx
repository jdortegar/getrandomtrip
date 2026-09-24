import Section from "@/components/layout/Section";
import { AdminBlogPageClient } from "../AdminBlogPageClient";
import { dashboardPageMetadata } from "@/lib/dashboard/pageMetadata";

export const generateMetadata = dashboardPageMetadata("/dashboard/admin/blog");

export default function AdminBlogPage() {
  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <AdminBlogPageClient />
      </div>
    </Section>
  );
}
