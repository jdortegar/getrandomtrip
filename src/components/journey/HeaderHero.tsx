"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CountryFlag } from "@/components/common/CountryFlag";

function getCountryFromLocation(
  location: string | null | undefined,
): string | null {
  if (!location?.trim()) return null;
  const parts = location
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1]! : location;
}

const DEFAULT_DESCRIPTION = (
  <>
    ¿<strong>Con quién</strong> vas a escribir tu próxima historia?
  </>
);

const DEFAULT_SUBTITLE = (
  <>
    PUNTO DE <span className="text-[#F2C53D]">PARTIDA</span>
  </>
);

interface TripperBadgeProps {
  name: string;
  avatarUrl: string | null;
  location: string | null;
}

interface HeaderHeroProps {
  backgroundImage?: string;
  className?: string;
  description?: React.ReactNode;
  eyebrowColor?: string;
  fallbackImage?: string;
  subtitle?: React.ReactNode | string | null;
  title: string;
  tripperBadge?: TripperBadgeProps;
  videoSrc?: string;
}

function HeaderHeroVideoBackground({
  fallbackImage,
  videoSrc,
}: {
  fallbackImage?: string;
  videoSrc?: string;
}) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsVideoReady(true);
    };

    const handleLoadedData = () => {
      setIsVideoReady(true);
    };

    const handleError = () => {
      setHasError(true);
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("error", handleError);

    const fallbackTimer = setTimeout(() => {
      if (!isVideoReady && !hasError) {
        setIsVideoReady(true);
      }
    }, 2000);

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("error", handleError);
      clearTimeout(fallbackTimer);
    };
  }, [isVideoReady, hasError]);

  return (
    <div className="absolute inset-0 h-full w-full">
      {/* Fallback Image */}
      {fallbackImage && (
        <div
          className="absolute inset-0 h-full w-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${fallbackImage})` }}
        />
      )}

      {/* Video Overlay - Only when ready */}
      {!hasError && videoSrc && (
        <video
          ref={videoRef}
          autoPlay
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            isVideoReady ? "opacity-100" : "opacity-0"
          }`}
          loop
          muted
          playsInline
          poster={fallbackImage}
          preload="metadata"
        >
          <source src={videoSrc.replace(".mp4", ".webm")} type="video/webm" />
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}

export default function HeaderHero({
  backgroundImage,
  className,
  description = DEFAULT_DESCRIPTION,
  eyebrowColor,
  fallbackImage = "/images/hero-image-1.jpeg",
  subtitle = DEFAULT_SUBTITLE,
  title,
  tripperBadge,
  videoSrc = "/videos/hero-video-1.mp4",
}: HeaderHeroProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-[40vh] items-center justify-center overflow-hidden",
        className,
      )}
    >
      {/* Video Background */}
      {videoSrc ? (
        <HeaderHeroVideoBackground
          fallbackImage={fallbackImage || backgroundImage}
          videoSrc={videoSrc}
        />
      ) : (
        <>
          {/* Fallback: Background Image */}
          {backgroundImage && (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" />
        </>
      )}

      {/* Content row: left text + optional right tripper info */}
      <div className="relative z-10 mx-auto w-full min-w-7/12 px-6 flex items-center justify-between gap-8 text-white max-w-7xl">
        {/* Left: eyebrow + title + description */}
        <div className="flex-1 text-left">
          {subtitle != null && (
            <p
              className="mb-2 font-bold text-sm uppercase tracking-[2px] md:tracking-[0.4em] md:text-base"
              style={eyebrowColor ? { color: eyebrowColor } : undefined}
              {...(typeof subtitle === "string"
                ? { dangerouslySetInnerHTML: { __html: subtitle } }
                : { children: subtitle })}
            />
          )}
          <h1 className="mb-6 font-barlow-condensed text-5xl md:text-7xl font-extrabold">
            {title}
          </h1>
          <p className="text-base">{description}</p>
        </div>

        {/* Right: tripper branding — only in curated journeys */}
        {tripperBadge &&
          (() => {
            const countryForFlag = getCountryFromLocation(
              tripperBadge.location,
            );
            return (
              <div className="flex shrink-0 items-center gap-4 md:gap-6">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full md:h-23 md:w-23">
                  {tripperBadge.avatarUrl ? (
                    <Image
                      alt={tripperBadge.name}
                      className="object-cover"
                      fill
                      sizes="92px"
                      src={tripperBadge.avatarUrl}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 font-barlow-condensed text-4xl font-bold text-white">
                      {tripperBadge.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-barlow-condensed text-xl font-extrabold uppercase leading-tight text-white md:text-2xl">
                    VIAJE CURADO POR
                    <br />
                    {tripperBadge.name.toUpperCase()}
                  </p>
                  {tripperBadge.location && (
                    <div className="mt-1 flex items-center gap-2 font-barlow-condensed text-sm font-semibold leading-none uppercase tracking-[0.4em] text-[#F2C53D]">
                      {countryForFlag && (
                        <CountryFlag
                          className="inline-block shrink-0 align-baseline"
                          country={countryForFlag}
                          title={tripperBadge.location}
                        />
                      )}
                      <span>{tripperBadge.location.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
      </div>
    </section>
  );
}
