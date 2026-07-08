import Section from "@/components/layout/Section";
import { AdminPaymentsPageClient } from "../AdminPaymentsPageClient";

export default function AdminPaymentsPage() {
  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <AdminPaymentsPageClient />
      </div>
    </Section>
  );
}
