import { notFound } from "next/navigation";
import { SentryExamplePageClient } from "@/components/app/sentry/SentryExamplePageClient";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function SentryExamplePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return <SentryExamplePageClient copy={dict.sentryExample} />;
}
