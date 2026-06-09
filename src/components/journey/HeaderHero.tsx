"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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
}

interface HeaderHeroProps {
  backgroundImage?: string;
  className?: string;
  description?: React.ReactNode;
  eyebrowColor?: string;
  fallbackImage?: string;
  subtitle?: React.ReactNode | string;
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

      {/* Tripper badge overlay — visible only in curated journeys */}
      {tripperBadge && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 backdrop-blur-sm">
          {tripperBadge.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={tripperBadge.name}
              className="h-8 w-8 rounded-full object-cover"
              src={tripperBadge.avatarUrl}
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-600 text-xs font-bold text-white">
              {tripperBadge.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-300">
              VIAJE CURADO POR
            </span>
            <span className="text-sm font-bold text-white leading-tight">
              {tripperBadge.name}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 mx-auto min-w-7/12 px-6 text-left text-white">
        <p
          className="mb-2 font-bold text-sm uppercase tracking-[2px] md:tracking-[0.4em] md:text-base"
          style={eyebrowColor ? { color: eyebrowColor } : undefined}
          {...(typeof subtitle === "string"
            ? { dangerouslySetInnerHTML: { __html: subtitle } }
            : { children: subtitle })}
        />

        <h1 className="mb-6 font-barlow-condensed text-5xl md:text-7xl font-extrabold">
          {title}
        </h1>

        <p className="text-base">{description}</p>
      </div>
    </section>
  );
}
