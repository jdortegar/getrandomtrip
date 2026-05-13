import { hasLocale } from "@/lib/i18n/config";
import Section from "@/components/layout/Section";
import { AdminXsedFormClient } from "../../AdminXsedFormClient";

export default async function AdminXsedNewPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await props.params;
  const locale = hasLocale(raw) ? raw : "es";
  return (
    <Section>
      <AdminXsedFormClient locale={locale} />
    </Section>
  );
}
