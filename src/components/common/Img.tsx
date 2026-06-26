"use client";
import Image, { ImageProps } from "next/image";
import { useState } from "react";

type ImgProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "width" | "height"
> & {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: ImageProps["sizes"];
  unoptimized?: boolean;
};

export default function Img({
  src,
  alt = "",
  width,
  height,
  className,
  priority,
  sizes = "100vw",
  unoptimized,
  ...rest
}: ImgProps) {
  const [errored, setErrored] = useState(false);
  const w = width ?? 1200;
  const h = height ?? 675;

  if (errored) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-200 ${className ?? ""}`}
        style={{ width: w, height: h }}
        role="img"
        aria-label={alt}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/logos/iso-randomtrip.svg"
          alt=""
          style={{
            maxHeight: 100,
            width: "auto",
            filter: "brightness(0) saturate(0) invert(40%)",
          }}
        />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      className={className}
      priority={priority}
      sizes={sizes}
      unoptimized={unoptimized}
      onError={() => setErrored(true)}
      {...rest}
    />
  );
}
