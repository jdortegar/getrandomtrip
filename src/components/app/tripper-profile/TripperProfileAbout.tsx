import { Plus } from "lucide-react";
import Img from "@/components/common/Img";
import { TRIPPER_PROFILE_ANCHORS } from "@/components/app/tripper-profile/TripperProfileSubnav";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { cn } from "@/lib/utils";
import type { TripperProfileEditorDict, TripperPublicProfileDict } from "@/lib/types/dictionary";
import type { TripperProfileBio } from "@/types/tripper";

interface TripperProfileAboutProps {
  affinityLabels: TripperProfileEditorDict["perspective"]["affinityOptions"];
  bio: TripperProfileBio;
  collectionNumber?: string;
  copy: TripperPublicProfileDict["about"];
  name: string;
  portraitUrl: string;
}

function isLocalUrl(url: string) {
  return url.startsWith("blob:") || url.startsWith("data:");
}

/** Notebook-framed portrait beside the bio, a "bit more about me" disclosure and the affinity tags. */
export function TripperProfileAbout({
  affinityLabels,
  bio,
  collectionNumber,
  copy,
  name,
  portraitUrl,
}: TripperProfileAboutProps) {
  const paragraphs = bio.body.split(/\n{2,}/).filter((paragraph) => paragraph.trim());

  return (
    <section
      aria-labelledby="tripper-about-title"
      className="rt-container scroll-mt-32 border-t border-gray-200 py-12 md:py-16"
      data-component="TripperProfileAbout"
      id={TRIPPER_PROFILE_ANCHORS.about}
    >
      <div className={cn("grid grid-cols-1 gap-10", "lg:grid-cols-[minmax(0,535fr)_minmax(0,633fr)] lg:gap-12")}>
        <figure className="rounded-3xl bg-secondary/25 p-4">
          <figcaption className="sr-only">
            {copy.notebookLabel}
            {collectionNumber ? ` / ${collectionNumber}` : null}
          </figcaption>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-300 lg:aspect-[16/15]">
            {portraitUrl ? (
              <Img
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                sizes="(min-width: 1024px) 40vw, 100vw"
                src={portraitUrl}
                unoptimized={isLocalUrl(portraitUrl)}
              />
            ) : null}
            {collectionNumber ? (
              <span aria-hidden className="absolute right-5 top-4 font-barlow-condensed text-6xl font-bold text-white/85">
                {collectionNumber}
              </span>
            ) : null}
            <span className="absolute inset-x-6 bottom-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
              {interpolateTemplate(copy.notebookCaption, { name })}
            </span>
          </div>
        </figure>

        <div className="flex flex-col">
          <p className="text-[10px] uppercase tracking-[0.18em] text-primary">{copy.eyebrow}</p>
          <h2
            className="mt-4 whitespace-pre-line font-barlow-condensed text-[34px] font-bold leading-[1.05] tracking-[-0.01em] text-ink md:text-[42px]"
            id="tripper-about-title"
          >
            {bio.title}
          </h2>
          {bio.lead ? <p className="mt-6 text-[22px] leading-[1.4] text-ink">{bio.lead}</p> : null}
          <div className="mt-6 flex flex-col gap-4 text-neutral-600">
            {paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>
          {bio.more ? (
            <details className="group mt-6 border-b border-gray-300">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm text-ink [&::-webkit-details-marker]:hidden">
                {copy.more}
                <Plus aria-hidden className="h-4 w-4 transition-transform group-open:rotate-45" />
              </summary>
              <p className="pb-5 text-neutral-700">{bio.more}</p>
            </details>
          ) : null}
          {bio.affinities.length ? (
            <ul aria-label={copy.affinitiesLabel} className="mt-6 flex flex-wrap gap-2">
              {bio.affinities.map((affinity) => (
                <li
                  className="rounded-[6px] border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium uppercase text-sky-700"
                  key={affinity}
                >
                  {affinityLabels[affinity]}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
