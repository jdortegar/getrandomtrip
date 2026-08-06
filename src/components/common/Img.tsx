"use client";
import Image, { ImageProps } from "next/image";
import { useEffect, useState } from "react";

type ImgProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "width" | "height" | "onError"
> & {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: ImageProps["sizes"];
  unoptimized?: boolean;
  /** Called when the image fails to load, e.g. to try a live search fallback before the built-in placeholder takes over. */
  onError?: () => void;
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
  onError,
  ...rest
}: ImgProps) {
  const [errored, setErrored] = useState(false);

  // A src swapped in after an error (e.g. a live search fallback resolving)
  // deserves a fresh attempt, not the permanently-stuck placeholder.
  useEffect(() => {
    setErrored(false);
  }, [src]);

  const w = width ?? 1200;
  const h = height ?? 675;

  if (errored) {
    // When the caller positions the image absolutely (fill-style layout,
    // e.g. "absolute inset-0 h-full w-full"), let those classes size the
    // fallback box too — an inline width/height here would win over them
    // and make the fallback the wrong size relative to the actual card.
    const isAbsolutelyPositioned = className?.includes("absolute");

    return (
      <div
        className={`flex items-center justify-center bg-neutral-200 ${className ?? ""}`}
        style={isAbsolutelyPositioned ? undefined : { width: w, height: h }}
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
      onError={() => {
        setErrored(true);
        onError?.();
      }}
      {...rest}
    />
  );
}
