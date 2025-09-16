"use client";

import { useState, useMemo } from "react";
import Image, { ImageProps } from "next/image";
import { getFallbackHeroImage } from "@/lib/assets";

type Props = Omit<ImageProps, "src"> & {
  srcPrimary: string;         // p.ej. /images/bitacoras/argentina.jpg
  countryName: string;        // "Argentina"
};

export default function AssetImage({ srcPrimary, countryName, alt, ...rest }: Props) {
  const [failed, setFailed] = useState(false);

  const src = useMemo(() => {
    return failed ? getFallbackHeroImage(countryName) : srcPrimary;
  }, [failed, countryName, srcPrimary]);

  return (
    <Image
      {...rest}
      alt={alt}
      src={src}
      onError={() => setFailed(true)}
    />
  );
}