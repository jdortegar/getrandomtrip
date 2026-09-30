import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignSystemGallery } from "@/components/app/design-system/DesignSystemGallery";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DesignSystemPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const { designSystem } = await getDictionary(locale);
  return <DesignSystemGallery copy={designSystem} />;
}
