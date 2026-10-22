import type { CSSProperties } from "react";
import Img from "@/components/common/Img";
import { LockupCaption } from "@/components/app/design-system/brand/LockupCaption";
import type { DesignSystemLogoDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  copy: DesignSystemLogoDict;
}

interface LogoConstruction {
  className: string;
  height: number;
  key: "iso" | "noTagline" | "tagline";
  src: string;
  width: number;
}

const iso = "/assets/logos/iso-randomtrip.svg";
const logo = "/assets/logos/logo_randomtrip_no_tag.svg";
const logoWithTagline = "/assets/logos/logo_randomtrip.svg";

const constructions: LogoConstruction[] = [
  {
    className: "h-24 w-24",
    height: 101,
    key: "iso",
    src: iso,
    width: 100,
  },
  {
    className: "h-auto max-w-72 w-full",
    height: 300,
    key: "noTagline",
    src: logo,
    width: 1203,
  },
  {
    className: "h-auto max-w-72 w-full",
    height: 300,
    key: "tagline",
    src: logoWithTagline,
    width: 1203,
  },
];

// Single-color lockups paint a background token through the logo's own shape.
const mask: CSSProperties = {
  maskImage: `url(${logo})`,
  maskPosition: "center",
  maskRepeat: "no-repeat",
  maskSize: "contain",
  WebkitMaskImage: `url(${logo})`,
  WebkitMaskPosition: "center",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskSize: "contain",
};

const masked = [
  { key: "teal", background: "bg-deep-teal", fill: "bg-ochre" },
  { key: "sage", background: "bg-mineral-sage", fill: "bg-deep-teal" },
  { key: "ochre", background: "bg-ochre", fill: "bg-white" },
] as const;

export function BrandLogo({ copy }: BrandLogoProps) {
  return (
    <>
      <div className={cn("gap-4 grid", "md:grid-cols-3")}>
        {constructions.map(({ className, height, key, src, width }) => (
          <figure
            className="border border-gray-200 overflow-hidden rounded-xl"
            data-construction={key}
            key={key}
          >
            <div className="bg-off-white flex items-center justify-center min-h-48 px-8 py-12">
              <Img
                alt={copy[key].alt}
                className={className}
                height={height}
                src={src}
                width={width}
              />
            </div>
            <LockupCaption {...copy[key]} />
          </figure>
        ))}
      </div>
      <div className={cn("gap-4 grid mt-4", "md:grid-cols-2")}>
        <figure
          className="border border-gray-200 overflow-hidden rounded-xl"
          data-lockup="original"
        >
          <div className="bg-off-white flex items-center justify-center px-8 py-12">
            <Img
              alt={copy.lockups.original.alt}
              className="h-auto max-w-72 w-full"
              height={300}
              src={logo}
              width={1203}
            />
          </div>
          <LockupCaption {...copy.lockups.original} />
        </figure>
        {masked.map(({ key, background, fill }) => (
          <figure
            className="border border-gray-200 overflow-hidden rounded-xl"
            data-lockup={key}
            key={key}
          >
            <div
              className={cn(
                "flex items-center justify-center px-8 py-12",
                background,
              )}
            >
              <div
                aria-label={copy.lockups[key].alt}
                className={cn("aspect-[1203/300] max-w-72 w-full", fill)}
                role="img"
                style={mask}
              />
            </div>
            <LockupCaption {...copy.lockups[key]} />
          </figure>
        ))}
      </div>
      <p className="mt-5 text-neutral-600 text-sm">{copy.note}</p>
    </>
  );
}
