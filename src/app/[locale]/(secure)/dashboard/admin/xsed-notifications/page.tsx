import Section from "@/components/layout/Section";
import { AdminXsedNotificationsPageClient } from "../AdminXsedNotificationsPageClient";

export default function AdminXsedNotificationsPage() {
  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <AdminXsedNotificationsPageClient />
      </div>
    </Section>
  );
}
