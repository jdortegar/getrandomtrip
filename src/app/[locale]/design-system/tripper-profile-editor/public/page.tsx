import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TripperPublicProfile } from "@/components/app/tripper-profile/TripperPublicProfile";
import {
  tripperProfileDraftFixture,
  tripperProfileEditorialStoriesFixture,
  tripperProfileStoriesFixture,
} from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryNavbarSolid } from "@/components/app/design-system/GalleryNavbarSolid";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

interface PublicProfileExamplePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ variant?: string }>;
}

export async function generateMetadata({ params }: PublicProfileExamplePageProps): Promise<Metadata> {
  const { locale } = await params;
  const robots = { follow: false, index: false };
  if (!hasLocale(locale)) return { robots };
  const { designSystem } = await getDictionary(locale);
  return { description: designSystem.profileEditorCatalog.metaDescription, robots, title: designSystem.profileEditorCatalog.publicMetaTitle };
}

/** Gallery example (noindex): the public Tripper profile rendered from the fictional sample draft. */
export default async function PublicProfileExamplePage({ params, searchParams }: PublicProfileExamplePageProps) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const { variant } = await searchParams;
  const dict = await getDictionary(locale);
  const draft = tripperProfileDraftFixture(locale);
  if (variant === "editorial") draft.featuredStoryIds = [];

  return (
    <main>
      <GalleryNavbarSolid />
      <TripperPublicProfile
        catalogCopy={{
          affinityLabels: dict.tripperProfileEditor.perspective.affinityOptions,
          typeCopy: dict.tripperProfileEditor.travelerTypes.types,
        }}
        collectionNumber="014"
        copy={dict.tripperPublicProfile}
        draft={draft}
        editorialStories={tripperProfileEditorialStoriesFixture(locale)}
        journeyHrefs={{ couple: "#", group: "#", solo: "#" }}
        locale={locale}
        stories={tripperProfileStoriesFixture(locale)}
      />
    </main>
  );
}
