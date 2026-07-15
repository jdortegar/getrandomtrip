import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { XsedDropShell } from "@/components/app/dashboard/admin/xsed/XsedDropShell";

export default async function NewXsedDropPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);

  return <XsedDropShell dict={dict.adminXsed.form} locale={locale} />;
}
