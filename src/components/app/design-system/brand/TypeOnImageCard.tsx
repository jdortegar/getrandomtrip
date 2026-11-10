import { BrandIndexLabel } from "@/components/app/design-system/brand/BrandIndexLabel";
import { WorksFailsLabel } from "@/components/app/design-system/brand/WorksFailsLabel";
import Img from "@/components/common/Img";
import type { DesignSystemTypeOnImageRuleDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface TypeOnImageCardProps {
  copy: DesignSystemTypeOnImageRuleDict;
  fails: readonly string[];
  failsLabel: string;
  works: readonly string[];
  worksLabel: string;
}

interface ExampleFrameProps {
  alt: string;
  hiddenCopy: DesignSystemTypeOnImageRuleDict["works"];
  label: string;
  orientation: "landscape" | "portrait";
  photo: string;
  variant: "works" | "fails";
}

function ExampleFrame({
  alt,
  hiddenCopy,
  label,
  orientation,
  photo,
  variant,
}: ExampleFrameProps) {
  const isLandscape = orientation === "landscape";
  return (
    <figure className="flex flex-col" data-type-example={variant}>
      <div className="bg-gray-50 p-1.5 rounded-lg">
        <div
          className={cn(
            "relative w-full",
            isLandscape ? "aspect-[32/19]" : "aspect-[57/67]",
          )}
          data-type-frame
        >
          <Img
            alt={alt}
            className="h-full object-contain w-full"
            height={isLandscape ? 456 : 536}
            sizes="(min-width: 1024px) 16vw, (min-width: 640px) 40vw, 100vw"
            src={photo}
            unoptimized
            width={isLandscape ? 768 : 456}
          />
        </div>
      </div>
      <p className="sr-only">
        {hiddenCopy.primary}
        {hiddenCopy.secondary ? ` ${hiddenCopy.secondary}` : ""}
        {hiddenCopy.caption ? ` ${hiddenCopy.caption}` : ""}
      </p>
      <figcaption className="mt-2">
        <WorksFailsLabel label={label} variant={variant} />
      </figcaption>
    </figure>
  );
}

export function TypeOnImageCard({
  copy,
  fails,
  failsLabel,
  works,
  worksLabel,
}: TypeOnImageCardProps) {
  const frames: {
    copy: DesignSystemTypeOnImageRuleDict["works"];
    label: string;
    photo: string;
    variant: "works" | "fails";
  }[] = [];
  const orientation = works.length > 1 ? "landscape" : "portrait";
  const pairCount = Math.max(works.length, fails.length);
  for (let index = 0; index < pairCount; index += 1) {
    const worksPhoto = works[index];
    const failsPhoto = fails[index];
    if (worksPhoto) {
      frames.push({
        copy: copy.works,
        label: worksLabel,
        photo: worksPhoto,
        variant: "works",
      });
    }
    if (failsPhoto) {
      frames.push({
        copy: copy.fails,
        label: failsLabel,
        photo: failsPhoto,
        variant: "fails",
      });
    }
  }

  return (
    <li
      className="bg-white border border-gray-200 p-5 rounded-xl"
      data-type-rule
    >
      <BrandIndexLabel as="h4">{copy.title}</BrandIndexLabel>
      <p className="mt-2 text-neutral-700 text-sm">{copy.body}</p>
      <div className={cn("gap-3 grid mt-4", "sm:grid-cols-2")}>
        {frames.map((frame, index) => (
          <ExampleFrame
            alt={index === 0 ? copy.alt : ""}
            hiddenCopy={frame.copy}
            key={`${frame.variant}-${frame.photo}`}
            label={frame.label}
            orientation={orientation}
            photo={frame.photo}
            variant={frame.variant}
          />
        ))}
      </div>
    </li>
  );
}
