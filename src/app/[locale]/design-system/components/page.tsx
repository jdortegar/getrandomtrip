import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignSystemGallery } from "@/components/app/design-system/DesignSystemGallery";
import { GalleryLlmsDocument } from "@/components/app/design-system/GalleryLlmsDocument";
import { DESIGN_SYSTEM_LLMS } from "@/lib/constants/DESIGN_SYSTEM_LLMS";
import { designSystemGalleryMetadata } from "@/lib/helpers/designSystemGalleryMetadata";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pathForLocale } from "@/lib/i18n/pathForLocale";

interface DesignSystemComponentsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: DesignSystemComponentsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return { robots: { index: false, follow: false } };
  return designSystemGalleryMetadata(locale);
}

export default async function DesignSystemComponentsPage({
  params,
}: DesignSystemComponentsPageProps) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const { designSystem } = await getDictionary(locale);
  const agentDocsHref = pathForLocale(locale, "/design-system/llms");
  return (
    <>
      <DesignSystemGallery
        agentDocsHref={agentDocsHref}
        brandHref={pathForLocale(locale, "/design-system")}
        componentsHref={pathForLocale(locale, "/design-system/components")}
        copy={designSystem}
        view="components"
      />
      <GalleryLlmsDocument
        copy={designSystem}
        href={agentDocsHref}
        markdown={DESIGN_SYSTEM_LLMS}
      />
    </>
  );
}
