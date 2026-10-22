import Img from "@/components/common/Img";
import { VOICE_EXAMPLES } from "@/lib/constants/BRAND_BOOK_PHOTOS";
import type { DesignSystemTypographyDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface TypeVoicePortraitsProps {
  documentaryAlt: string;
  editorialAlt: string;
  voices: DesignSystemTypographyDict["voices"];
}

export function TypeVoicePortraits({
  documentaryAlt,
  editorialAlt,
  voices,
}: TypeVoicePortraitsProps) {
  return (
    <div className={cn("gap-4 grid", "sm:grid-cols-2")}>
      <div
        className="aspect-[114/127] overflow-hidden rounded-xl"
        data-voice-portrait="paired"
      >
        <Img
          alt={editorialAlt}
          className="h-full object-contain w-full"
          height={762}
          priority
          sizes="(min-width: 1024px) 28vw, (min-width: 640px) 40vw, 100vw"
          src={VOICE_EXAMPLES.paired}
          unoptimized
          width={684}
        />
        <p className="sr-only">
          {voices.editorial.sample} {voices.human.sample}
        </p>
      </div>
      <div
        className="aspect-[114/127] overflow-hidden rounded-xl"
        data-voice-portrait="documentary"
      >
        <Img
          alt={documentaryAlt}
          className="h-full object-contain w-full"
          height={762}
          priority
          sizes="(min-width: 1024px) 28vw, (min-width: 640px) 40vw, 100vw"
          src={VOICE_EXAMPLES.documentary}
          unoptimized
          width={684}
        />
        <p className="sr-only">{voices.documentary.sample}</p>
      </div>
    </div>
  );
}
