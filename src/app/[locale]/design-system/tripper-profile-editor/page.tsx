import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileEditorCatalog } from "@/components/app/design-system/profile-editor/ProfileEditorCatalog";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pathForLocale } from "@/lib/i18n/pathForLocale";

interface ProfileEditorCatalogPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ProfileEditorCatalogPageProps): Promise<Metadata> {
  const { locale } = await params;
  const robots = { follow: false, index: false };
  if (!hasLocale(locale)) return { robots };
  const { designSystem } = await getDictionary(locale);
  return {
    description: designSystem.profileEditorCatalog.metaDescription,
    robots,
    title: designSystem.profileEditorCatalog.metaTitle,
  };
}

/** Gallery (noindex): every Tripper profile editor component in isolation, with its states. */
export default async function ProfileEditorCatalogPage({ params }: ProfileEditorCatalogPageProps) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <ProfileEditorCatalog
      backHref={pathForLocale(locale, "/design-system/components")}
      backLabel={dict.designSystem.profileEditorExample.backToComponents}
      catalog={dict.designSystem.profileEditorCatalog}
      copy={dict.tripperProfileEditor}
      flowHref={pathForLocale(locale, "/design-system/tripper-profile-editor/flow")}
      locale={locale}
      publicCopy={dict.tripperPublicProfile}
      publicHref={pathForLocale(locale, "/design-system/tripper-profile-editor/public")}
    />
  );
}
