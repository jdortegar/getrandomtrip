import Img from "@/components/common/Img";
import type {
  DesignSystemTripperCollectionDict,
  DesignSystemTripperSampleDict,
} from "@/lib/types/dictionary";

interface TripperCollectionFrameProps {
  collection?: DesignSystemTripperCollectionDict;
  height: number;
  photo: string;
  sample: DesignSystemTripperSampleDict;
  sizes: string;
  strip: "sage" | "ochre" | "teal";
  width: number;
}

export function TripperCollectionFrame({
  collection,
  height,
  photo,
  sample,
  sizes,
  strip,
  width,
}: TripperCollectionFrameProps) {
  return (
    <figure className="w-full" data-strip={strip} data-tripper-frame>
      <Img
        alt={sample.alt}
        className="h-auto object-contain w-full"
        height={height}
        sizes={sizes}
        src={photo}
        unoptimized
        width={width}
      />
      <figcaption className="sr-only">
        {sample.name} {sample.subtitle} {sample.quote} {sample.handle}
        {collection ? (
          <span data-collection-label>
            {collection.number} {collection.role} {collection.location}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
