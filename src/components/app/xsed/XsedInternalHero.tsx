'use client';

import Image from 'next/image';
import CountryFlag from '@/components/common/CountryFlag';
import VideoBackground from '@/components/media/VideoBackground';
import { getCountryFromLocation } from '@/lib/helpers/flags';

export interface XsedInternalHeroContent {
  dropNumber: number;
  date: string;
  title: string;
  backgroundImage: string;
  author: {
    name: string;
    location: string;
    avatarUrl: string;
  };
}

interface XsedInternalHeroProps {
  content: XsedInternalHeroContent;
}

export function XsedInternalHero({ content }: XsedInternalHeroProps) {
  const {
    dropNumber,
    date,
    title,
    backgroundImage,
    author,
  } = content;

  const countryForFlag = getCountryFromLocation(author.location);

  return (
    <section className="relative h-[60vh] min-h-[520px] w-full overflow-hidden bg-slate-950 text-white">
      {/* Background image */}
      <VideoBackground
        fallbackImage={backgroundImage}
      />

      {/* Content pinned to bottom-left */}
      <div className="relative z-10 flex flex-col justify-center h-full container mx-auto md:px-20 px-4">
        <div className="flex flex-col gap-6">
          <div>
            {/* XSED + drop info row */}
            <div className="flex items-end gap-3 mb-3">
              <h2 className="font-barlow-condensed font-extrabold text-[80px] md:text-[130px] z-10 leading-[0.8] [&_sup]:text-[0.6em]">
                XSED
              </h2>

              <div className="flex justify-end gap-2">
                <span
                  aria-hidden
                  className="self-stretch w-px bg-xsed rounded-full"
                  style={{ minHeight: 40 }}
                />
                <div className="flex flex-col justify-end">
                  <p className="font-barlow text-lg uppercase leading-tight tracking-wide text-white">
                    X SUERTE<br />ES DOMINGO&nbsp;
                    <span className="font-bold">Nº{dropNumber}</span>
                  </p>
                  <p className="font-barlow text-sm font-semibold uppercase tracking-[0.18em] text-xsed mt-1">
                    {date}
                  </p>
                </div>
              </div>

            </div>

            {/* Big drop title */}
            <h1 className="font-barlow-condensed font-extrabold text-[80px] md:text-[100px] z-10 leading-[0.8] [&_sup]:text-[0.6em]">
              {title}
            </h1>
          </div>
          {/* Tripper identity row */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full md:h-23 md:w-23">
              {author.avatarUrl ? (
                <Image
                  alt={author.name ?? ''}
                  className="object-cover"
                  fill
                  sizes="64px"
                  src={author.avatarUrl}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-barlow-condensed rounded-full bg-linear-to-br from-blue-500 to-purple-600 font-bold text-white text-4xl">
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

              {author.location && (
                <div className="mt-0.5 flex items-center gap-2 font-barlow-condensed text-sm font-semibold leading-none uppercase tracking-[0.4em] text-[#F2C53D]">
                  {countryForFlag && (
                    <CountryFlag
                      className="inline-block shrink-0 align-baseline"
                      country={countryForFlag}
                      title={author.location}
                    />
                  )}
                  <span>{author.location.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
