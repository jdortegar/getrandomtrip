import { BrandIndexLabel } from "@/components/app/design-system/brand/BrandIndexLabel";
import Img from "@/components/common/Img";
import type { DesignSystemPhotoPrincipleDict } from "@/lib/types/dictionary";

interface PhotoPrincipleCardProps {
  copy: DesignSystemPhotoPrincipleDict;
  photo: string;
}

export function PhotoPrincipleCard({ copy, photo }: PhotoPrincipleCardProps) {
  return (
    <article
      className="bg-white border border-gray-200 overflow-hidden rounded-xl"
      data-photo-principle
    >
      <Img
        alt={copy.alt}
        className="aspect-3/4 h-auto object-cover w-full"
        height={640}
        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
        src={photo}
        width={480}
      />
      <div className="p-4">
        <BrandIndexLabel as="h4" className="leading-tight">
          {copy.title}
        </BrandIndexLabel>
        <p className="mt-2 text-neutral-700 text-sm">{copy.body}</p>
      </div>
    </article>
  );
}
