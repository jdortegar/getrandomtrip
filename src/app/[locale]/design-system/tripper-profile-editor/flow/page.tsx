import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TripperProfileEditorShell } from "@/components/app/dashboard/tripper/profile-editor/TripperProfileEditorShell";
import {
  tripperProfileDraftFixture,
  tripperProfileStoriesFixture,
} from "@/components/app/design-system/fixtures/tripperProfileEditorFixture";
import { GalleryNavbarSolid } from "@/components/app/design-system/GalleryNavbarSolid";
import { Button } from "@/components/ui/Button";
import { buildEmptyTripperProfileDraft } from "@/lib/helpers/tripperProfileEditor";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { cn } from "@/lib/utils";

interface TripperProfileEditorExamplePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ variant?: string }>;
}

const ROUTE = "/design-system/tripper-profile-editor/flow";
const CATALOG_ROUTE = "/design-system/tripper-profile-editor";

export async function generateMetadata({
  params,
}: TripperProfileEditorExamplePageProps): Promise<Metadata> {
  const { locale } = await params;
  const robots = { follow: false, index: false };
  if (!hasLocale(locale)) return { robots };
  const { designSystem } = await getDictionary(locale);
  return {
    description: designSystem.profileEditorExample.metaDescription,
    robots,
    title: designSystem.profileEditorExample.metaTitle,
  };
}

/** Gallery example (noindex): the real profile editor with fictional data, no auth, nothing persisted. */
export default async function TripperProfileEditorFlowPage({
  params,
  searchParams,
}: TripperProfileEditorExamplePageProps) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const { variant } = await searchParams;
  const isNew = variant === "new";
  const dict = await getDictionary(locale);
  const copy = dict.designSystem.profileEditorExample;
  const baseHref = pathForLocale(locale, ROUTE);
  const variants = [
    { href: baseHref, isActive: !isNew, label: copy.variantFull },
    { href: `${baseHref}?variant=new`, isActive: isNew, label: copy.variantNew },
  ];

  return (
    <main className="bg-ground">
      <GalleryNavbarSolid />
      <div className="border-b border-gray-200 bg-secondary/20">
        <div className={cn("rt-container flex flex-col gap-4 py-8 text-left", "md:flex-row md:items-end md:justify-between")}>
          <div className="max-w-2xl">
            <Button asChild className="-ml-1 mb-3 w-fit px-1 normal-case tracking-normal" variant="link">
              <Link href={pathForLocale(locale, CATALOG_ROUTE)}>
                <ArrowLeft aria-hidden />
                {copy.backLink}
              </Link>
            </Button>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{copy.eyebrow}</p>
            <h1 className="mt-2 font-barlow-condensed text-3xl font-bold uppercase leading-none text-ink">
              {copy.title}
            </h1>
            <p className="mt-2 text-sm text-neutral-700">{copy.body}</p>
          </div>
          <nav aria-label={copy.variants} className="flex flex-wrap gap-2">
            {variants.map((item) => (
              <Button asChild key={item.href} size="sm" variant={item.isActive ? "default" : "secondary"}>
                <Link aria-current={item.isActive ? "page" : undefined} href={item.href}>
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>
      </div>
      <TripperProfileEditorShell
        blogHref="#"
        copy={dict.tripperProfileEditor}
        initialDraft={isNew ? buildEmptyTripperProfileDraft() : tripperProfileDraftFixture(locale)}
        initialStatus="DRAFT"
        key={isNew ? "new" : "full"}
        locale={locale}
        previewHref={pathForLocale(locale, "/design-system/tripper-profile-editor/public")}
        stories={isNew ? [] : tripperProfileStoriesFixture(locale)}
      />
    </main>
  );
}
