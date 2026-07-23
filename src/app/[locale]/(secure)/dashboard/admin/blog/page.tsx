import Section from "@/components/layout/Section";
import { AdminBlogPageClient } from "../AdminBlogPageClient";

export default function AdminBlogPage() {
  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <AdminBlogPageClient />
      </div>
    </Section>
  );
}
