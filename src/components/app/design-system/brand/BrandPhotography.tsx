import { PhotoPrincipleCard } from "@/components/app/design-system/brand/PhotoPrincipleCard";
import { PhotographyIntro } from "@/components/app/design-system/brand/PhotographyIntro";
import { TripperCollectionFrame } from "@/components/app/design-system/brand/TripperCollectionFrame";
import {
  PHOTOGRAPHY_PHOTOS,
  TRIPPER_PHOTOS,
} from "@/lib/constants/BRAND_BOOK_PHOTOS";
import type { DesignSystemPhotographyDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface BrandPhotographyProps {
  copy: DesignSystemPhotographyDict;
}

const photos = PHOTOGRAPHY_PHOTOS;
const trippers = TRIPPER_PHOTOS;

export function BrandPhotography({ copy }: BrandPhotographyProps) {
  return (
    <>
      {(["philosophy", "treatment"] as const).map((group) => (
        <div className="mb-12" key={group}>
          <PhotographyIntro
            body={copy[group].body}
            lead={copy[group].lead}
            title={copy[group].title}
          />
          <div className={cn("gap-4 grid", "sm:grid-cols-2", "lg:grid-cols-5")}>
            {copy[group].items.map((item, index) => {
              const photo = photos[group][index];
              if (!photo) return null;
              return (
                <PhotoPrincipleCard
                  copy={item}
                  key={item.title}
                  photo={photo}
                />
              );
            })}
          </div>
        </div>
      ))}
      <PhotographyIntro
        body={copy.trippers.body}
        lead={copy.trippers.lead}
        title={copy.trippers.title}
      />
      <div className="bg-secondary mb-6 max-w-lg p-5 rounded-xl">
        <p className="font-semibold text-ink text-xs tracking-widest uppercase">
          {copy.trippers.note.title}
        </p>
        <p className="mt-2 text-ink text-sm">{copy.trippers.note.body}</p>
      </div>
      <p className="font-semibold mb-3 text-primary text-xs tracking-widest uppercase">
        {copy.trippers.examplesLabel}
      </p>
      <div
        className={cn("gap-4 grid items-end", "sm:grid-cols-2", "lg:grid-cols-4")}
      >
        {copy.trippers.examples.map((sample, index) => {
          const tripper = trippers[index];
          if (!tripper) return null;
          return (
            <div
              className="overflow-hidden rounded-xl"
              key={sample.handle}
            >
              <TripperCollectionFrame
                collection={
                  index === 0 ? copy.trippers.collection : undefined
                }
                height={tripper.height}
                photo={tripper.photo}
                sample={sample}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                strip={tripper.strip}
                width={tripper.width}
              />
            </div>
          );
        })}
      </div>
      <p className="font-semibold mb-3 mt-6 text-primary text-xs tracking-widest uppercase">
        {copy.trippers.principlesLabel}
      </p>
      <ul className={cn("gap-4 grid", "sm:grid-cols-2", "lg:grid-cols-3")}>
        {copy.trippers.principles.map((principle) => (
          <li
            className="bg-white border border-gray-200 p-4 rounded-xl"
            key={principle.title}
          >
            <h4 className="font-semibold text-primary text-sm uppercase">
              {principle.title}
            </h4>
            <p className="mt-1 text-neutral-700 text-sm">{principle.body}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-neutral-600 text-xs">
        {copy.trippers.sampleNote}
      </p>
    </>
  );
}
