"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { ProfileCatalogExampleProps } from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryNavbarSolid } from "@/components/app/design-system/GalleryNavbarSolid";
import { GallerySection } from "@/components/app/design-system/GallerySection";
import { ProfileCatalogAtlas } from "@/components/app/design-system/profile-editor/ProfileCatalogAtlas";
import { ProfileCatalogChrome } from "@/components/app/design-system/profile-editor/ProfileCatalogChrome";
import { ProfileCatalogFields } from "@/components/app/design-system/profile-editor/ProfileCatalogFields";
import { ProfileCatalogIdentity } from "@/components/app/design-system/profile-editor/ProfileCatalogIdentity";
import { ProfileCatalogImageInputs } from "@/components/app/design-system/profile-editor/ProfileCatalogImageInputs";
import { ProfileCatalogMedia } from "@/components/app/design-system/profile-editor/ProfileCatalogMedia";
import { ProfileCatalogPerspective } from "@/components/app/design-system/profile-editor/ProfileCatalogPerspective";
import { ProfileCatalogProgress } from "@/components/app/design-system/profile-editor/ProfileCatalogProgress";
import { ProfileCatalogPublicAtlas } from "@/components/app/design-system/profile-editor/ProfileCatalogPublicAtlas";
import { ProfileCatalogPublicHero } from "@/components/app/design-system/profile-editor/ProfileCatalogPublicHero";
import { ProfileCatalogPublicJourneys } from "@/components/app/design-system/profile-editor/ProfileCatalogPublicJourneys";
import { ProfileCatalogPublicMedia } from "@/components/app/design-system/profile-editor/ProfileCatalogPublicMedia";
import { ProfileCatalogPublicStories } from "@/components/app/design-system/profile-editor/ProfileCatalogPublicStories";
import { ProfileCatalogReview } from "@/components/app/design-system/profile-editor/ProfileCatalogReview";
import { ProfileCatalogStories } from "@/components/app/design-system/profile-editor/ProfileCatalogStories";
import { ProfileCatalogStructure } from "@/components/app/design-system/profile-editor/ProfileCatalogStructure";
import { ProfileCatalogTravelerTypes } from "@/components/app/design-system/profile-editor/ProfileCatalogTravelerTypes";
import { Button } from "@/components/ui/Button";
import {
  PROFILE_EDITOR_CATALOG_SECTIONS,
  type ProfileEditorCatalogSection,
} from "@/lib/constants/PROFILE_EDITOR_CATALOG";
import { gallerySectionNumber } from "@/lib/constants/DESIGN_SYSTEM_GALLERY";
import { cn } from "@/lib/utils";

interface ProfileEditorCatalogProps extends ProfileCatalogExampleProps {
  backHref: string;
  backLabel: string;
  flowHref: string;
  publicHref: string;
}

const SECTION_EXAMPLES = {
  atlas: ProfileCatalogAtlas,
  chrome: ProfileCatalogChrome,
  fields: ProfileCatalogFields,
  identity: ProfileCatalogIdentity,
  imageInputs: ProfileCatalogImageInputs,
  media: ProfileCatalogMedia,
  perspective: ProfileCatalogPerspective,
  progress: ProfileCatalogProgress,
  publicAtlas: ProfileCatalogPublicAtlas,
  publicHero: ProfileCatalogPublicHero,
  publicJourneys: ProfileCatalogPublicJourneys,
  publicMedia: ProfileCatalogPublicMedia,
  publicStories: ProfileCatalogPublicStories,
  review: ProfileCatalogReview,
  stories: ProfileCatalogStories,
  structure: ProfileCatalogStructure,
  travelerTypes: ProfileCatalogTravelerTypes,
} as const satisfies Record<ProfileEditorCatalogSection, ComponentType<ProfileCatalogExampleProps>>;

const INDEX_LINK_CLASS = cn(
  "flex h-12 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-xs text-neutral-600 transition-colors",
  "hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
);

/** Component catalog of the Tripper profile editor: every piece in isolation, in its states. */
export function ProfileEditorCatalog({
  backHref,
  backLabel,
  catalog,
  copy,
  flowHref,
  locale,
  publicCopy,
  publicHref,
}: ProfileEditorCatalogProps) {
  return (
    <div className="min-w-0 bg-ground text-ink" data-component="ProfileEditorCatalog">
      <GalleryNavbarSolid />
      <header className="rt-container pb-10 pt-12 text-left">
        <Button asChild className="-ml-1 mb-6 w-fit px-1 normal-case tracking-normal" variant="link">
          <Link href={backHref}>
            <ArrowLeft aria-hidden />
            {backLabel}
          </Link>
        </Button>
        <div className={cn("flex flex-col gap-6", "md:flex-row md:items-end md:justify-between")}>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{catalog.hero.eyebrow}</p>
            <h1 className="mt-3 font-barlow-condensed text-5xl font-bold uppercase leading-[0.95] text-ink">
              {catalog.hero.title}
            </h1>
            <p className="mt-4 text-neutral-600">{catalog.hero.body}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="md" variant="secondary">
              <Link href={publicHref}>
                {catalog.publicCta}
                <ArrowUpRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="md">
              <Link href={flowHref}>
                {catalog.flowCta}
                <ArrowUpRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <nav aria-label={catalog.index} className="sticky top-16 z-30 border-y border-gray-200 bg-ground">
        <div className="rt-container">
          <ol className="flex min-w-0 overflow-x-auto">
            {PROFILE_EDITOR_CATALOG_SECTIONS.map((id) => (
              <li className="shrink-0" key={id}>
                <a className={INDEX_LINK_CLASS} href={`#${id}`}>
                  <span className="font-mono">{gallerySectionNumber(PROFILE_EDITOR_CATALOG_SECTIONS, id)}</span>
                  {catalog.sections[id].nav}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </nav>

      <div className="rt-container min-w-0 text-left">
        {PROFILE_EDITOR_CATALOG_SECTIONS.map((id) => {
          const Example = SECTION_EXAMPLES[id];
          return (
            <GallerySection
              copy={catalog.sections[id]}
              id={id}
              key={id}
              number={gallerySectionNumber(PROFILE_EDITOR_CATALOG_SECTIONS, id)}
            >
              <Example catalog={catalog} copy={copy} locale={locale} publicCopy={publicCopy} />
            </GallerySection>
          );
        })}
      </div>
    </div>
  );
}
