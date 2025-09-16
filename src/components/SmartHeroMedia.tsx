"use client";

import { useState } from "react";
import AssetImage from "@/components/AssetImage";

type Props = {
  countryName: string;
  heroImage: string;    // ruta local sugerida /images/bitacoras/{slug}.jpg
  heroVideo?: string;   // ruta local sugerida /videos/{slug}.mp4
};

export default function SmartHeroMedia({ countryName, heroImage, heroVideo }: Props) {
  const [videoFailed, setVideoFailed] = useState(false);

  const showVideo = heroVideo && !videoFailed;

  return (
    <div className="relative w-full h-[60vh] min-h-[380px] overflow-hidden">
      {showVideo ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoFailed(true)}
          poster={heroImage}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
      ) : (
        <AssetImage
          srcPrimary={heroImage}
          countryName={countryName}
          alt={`Hero de ${countryName}`}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      )}

      {/* Overlay sutil */}
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}