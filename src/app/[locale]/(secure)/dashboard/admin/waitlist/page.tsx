import Section from "@/components/layout/Section";
import { AdminWaitlistPageClient } from "../AdminWaitlistPageClient";

export default function AdminWaitlistPage() {
  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <AdminWaitlistPageClient />
      </div>
    </Section>
  );
}
