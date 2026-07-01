import Section from "@/components/layout/Section";
import { AccountSettingsPanel } from "@/components/app/account/AccountSettingsPanel";

export default function ClientSettingsPage() {
  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <AccountSettingsPanel role="client" />
      </div>
    </Section>
  );
}
