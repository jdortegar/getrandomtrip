"use client";

import { ArrowUpRight, Play, X } from "lucide-react";
import Img from "@/components/common/Img";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { getMediaEmbedUrl } from "@/lib/helpers/tripperPublicProfile";
import { cn } from "@/lib/utils";
import type { TripperPublicProfileDict } from "@/lib/types/dictionary";
import type { TripperProfileMediaItem } from "@/types/tripper";

interface TripperProfileMediaCardProps {
  copy: TripperPublicProfileDict["media"];
  /** 1-based position shown in the card header ("YOUTUBE / 01"). */
  index: number;
  isActive: boolean;
  item: TripperProfileMediaItem;
  onActivate: () => void;
  onStop: () => void;
}

function isLocalUrl(url: string) {
  return url.startsWith("blob:") || url.startsWith("data:");
}

/**
 * One social/video piece. External players load only after "Play" (no
 * third-party requests on page load); own videos use native controls and never
 * autoplay. Every external piece keeps a link to the original.
 */
export function TripperProfileMediaCard({ copy, index, isActive, item, onActivate, onStop }: TripperProfileMediaCardProps) {
  const provider = copy.providers[item.provider];
  const embedUrl = getMediaEmbedUrl(item);
  const isExternal = item.provider !== "upload";
  const title = item.title.trim();

  const poster = item.posterUrl ? (
    <Img
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      sizes="(min-width: 1024px) 33vw, 85vw"
      src={item.posterUrl}
      unoptimized={isLocalUrl(item.posterUrl)}
    />
  ) : null;
  const overlayClass = cn(
    "group absolute inset-0 flex items-center justify-center",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-feature",
  );
  const boxClass = cn(
    "relative flex items-center gap-1.5 border border-white/80 bg-black/35 px-4 py-2.5 text-sm text-white transition-colors",
    "group-hover:bg-black/55",
  );

  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-2xl bg-white/60 shadow-sm ring-1 ring-gray-200"
      data-component="TripperProfileMediaCard"
    >
      <p className="px-4 py-3 text-[9px] uppercase tracking-[0.13em] text-primary">
        {provider} / {String(index).padStart(2, "0")}
      </p>
      <div className="relative h-[330px] bg-ink lg:h-[340px]">
        {item.provider === "upload" ? (
          <video className="absolute inset-0 h-full w-full object-cover" controls poster={item.posterUrl || undefined} preload="metadata" src={item.url || undefined} />
        ) : isActive && embedUrl ? (
          <>
            <iframe
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0 bg-white"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              src={embedUrl}
              title={interpolateTemplate(copy.playerTitle, { provider, title: title || provider })}
            />
            <button
              aria-label={copy.stop}
              className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center bg-white/90 text-ink shadow"
              onClick={onStop}
              type="button"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </>
        ) : embedUrl ? (
          <button aria-label={`${copy.play}: ${title || provider}`} className={overlayClass} onClick={onActivate} type="button">
            {poster}
            <span className={boxClass}>
              {copy.play}
              <Play aria-hidden className="h-3.5 w-3.5 fill-current" />
            </span>
          </button>
        ) : (
          <a className={overlayClass} href={item.url} rel="noopener noreferrer" target="_blank">
            {poster}
            <span className={boxClass}>
              {copy.openProfile}
              <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
            </span>
          </a>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        {title ? (
          <h3 className="font-barlow-condensed text-[30px] font-bold leading-[1.08] tracking-[-0.025em] text-ink md:text-[31px]">{title.replace(/\n/g, " ")}</h3>
        ) : null}
        {isExternal ? (
          <a
            className="mt-auto flex w-fit min-h-6 items-center gap-1 border-b border-primary text-[13px] text-primary hover:text-primary/80"
            href={item.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            {interpolateTemplate(copy.original, { provider })}
            <ArrowUpRight aria-hidden className="h-3 w-3" />
          </a>
        ) : null}
      </div>
    </article>
  );
}
