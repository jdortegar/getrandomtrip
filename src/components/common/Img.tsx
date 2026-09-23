"use client";
import Image, { ImageProps } from "next/image";
import { useState } from "react";

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
  const [imageState, setImageState] = useState({ src, errored: false });

  // A src swapped in after an error (e.g. a live search fallback resolving)
  // deserves a fresh attempt, not the permanently-stuck placeholder.
  if (imageState.src !== src) {
    setImageState({ src, errored: false });
  }

  const w = width ?? 1200;
  const h = height ?? 675;

  if (imageState.src === src && imageState.errored) {
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
        data-component="Img"
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
        setImageState({ src, errored: true });
        onError?.();
      }}
      {...rest}
      data-component="Img"
    />
  );
}
