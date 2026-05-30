"use client";

import Image from "next/image";
import CountryFlag from "@/components/common/CountryFlag";
import VideoBackground from "@/components/media/VideoBackground";
import { getCountryFromLocation } from "@/lib/helpers/flags";
import { formatTitleWithCopyright } from "@/lib/helpers/stringHelpers";
import type { MarketingDictionary, XsedPageDict } from "@/lib/types/dictionary";

export interface XsedInternalHeroContent {
  author?: {
    avatarUrl: string;
    location: string;
    name: string;
  };
  backgroundImage?: string;
  date?: string;
  description?: string;
  dropNumber?: number;
  title?: string;
}

interface XsedInternalHeroProps {
  content: XsedInternalHeroContent;
  dropsPage?: MarketingDictionary["xsedDropsPage"];
  hero: XsedPageDict["hero"];
}

export function XsedInternalHero({
  content,
  dropsPage,
  hero,
}: XsedInternalHeroProps) {
  const { author, date, dropNumber } = content;
  const title = content.title ?? dropsPage?.title ?? "";
  const description = content.description ?? dropsPage?.description ?? "";
  const backgroundImage = content.backgroundImage ?? hero.fallbackImage;

  const countryForFlag = author
    ? getCountryFromLocation(author.location)
    : null;
  const dropNumberText =
    dropNumber != null && !Number.isNaN(dropNumber)
      ? hero.dropNumberLabel.replace("{number}", String(dropNumber))
      : null;

  return (
    <section className="relative h-[60vh] min-h-[520px] w-full overflow-hidden bg-slate-950 text-white">
      <VideoBackground fallbackImage={backgroundImage} />

      <div className="relative z-10 flex h-full flex-col justify-center container mx-auto px-4 md:px-20">
        <div className="flex flex-col gap-6">
          <div>
            <div className="mb-3 flex flex-wrap items-end gap-x-3 gap-y-2">
              <h2 className="font-barlow-condensed text-[52px] font-extrabold leading-[0.8] z-10 sm:text-[80px] md:text-[130px] [&_sup]:text-[0.6em]">
                {formatTitleWithCopyright(hero.title)}
              </h2>

              <div className="flex justify-end gap-2">
                <span
                  aria-hidden
                  className="self-stretch w-px rounded-full bg-xsed"
                  style={{ minHeight: 40 }}
                />
                <div className="flex flex-col justify-end">
                  <p
                    className="font-barlow text-sm sm:text-lg uppercase leading-tight tracking-wide text-white"
                    dangerouslySetInnerHTML={{ __html: hero.subtitle }}
                  />
                  {dropNumberText ? (
                    <p className="font-barlow mt-1 text-sm font-bold uppercase tracking-wide text-white">
                      {dropNumberText}
                    </p>
                  ) : null}
                  {date ? (
                    <p className="font-barlow mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-xsed">
                      {date}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {title ? (
              <h1 className="font-barlow-condensed text-[38px] font-extrabold leading-[0.85] z-10 md:text-[60px] lg:text-[100px] [&_sup]:text-[0.6em]">
                {title}
              </h1>
            ) : null}
            {description ? (
              <p className="font-barlow mt-4 max-w-sm text-sm sm:text-base text-white/70">
                {description}
              </p>
            ) : null}
          </div>

          {author ? (
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full md:h-23 md:w-23">
                {author.avatarUrl ? (
                  <Image
                    alt={author.name ?? ""}
                    className="object-cover"
                    fill
                    sizes="64px"
                    src={author.avatarUrl}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 font-barlow-condensed text-4xl font-bold text-white">
                    {author.name?.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <p className="font-barlow-condensed text-xl font-bold uppercase tracking-wide text-white md:text-2xl">
                    {author.name}
                  </p>
                </div>
                {author.location ? (
                  <div className="mt-0.5 flex items-center gap-2 font-barlow-condensed text-sm font-semibold uppercase leading-none tracking-[0.4em] text-[#F2C53D]">
                    {countryForFlag ? (
                      <CountryFlag
                        className="inline-block shrink-0 align-baseline"
                        country={countryForFlag}
                        title={author.location}
                      />
                    ) : null}
                    <span>{author.location.toUpperCase()}</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
