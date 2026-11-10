import { TypeOnImageExamples } from "@/components/app/design-system/brand/TypeOnImageExamples";
import { TypeVoicePortraits } from "@/components/app/design-system/brand/TypeVoicePortraits";
import type { DesignSystemTypographyDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface BrandTypographyProps {
  copy: DesignSystemTypographyDict;
}

const voices = [
  {
    key: "editorial",
    sample: [
      "font-barlow-condensed font-bold leading-none text-2xl uppercase",
      "sm:text-3xl",
    ],
  },
  {
    key: "human",
    sample: ["font-nothing-you-could-do leading-snug text-xl", "sm:text-2xl"],
  },
  {
    key: "documentary",
    sample: ["font-normal leading-relaxed text-sm", "sm:text-base"],
  },
] as const;

export function BrandTypography({ copy }: BrandTypographyProps) {
  return (
    <>
      <div className={cn("gap-6 grid mb-8", "md:grid-cols-2")}>
        <p className="font-barlow-condensed font-bold leading-tight text-2xl uppercase">
          {copy.intro.title}
        </p>
        <p className="text-neutral-700 text-sm">{copy.intro.body}</p>
      </div>
      <div
        className={cn(
          "gap-4 grid mb-2",
          "lg:grid-cols-[minmax(16rem,0.7fr)_1.3fr] lg:items-start",
        )}
      >
        <div className="bg-white border border-gray-200 divide-gray-200 divide-y overflow-hidden rounded-xl">
          {voices.map(({ key, sample }) => {
            const voice = copy.voices[key];
            return (
              <div className="p-4" key={key}>
                <div>
                  <h3 className="font-semibold text-lg">{voice.title}</h3>
                  <p className="font-semibold mt-2 text-primary text-xs tracking-widest uppercase">
                    {voice.traits}
                  </p>
                  <p className="mt-2 text-neutral-700 text-sm">
                    {voice.purpose}
                  </p>
                  <p className="font-mono mt-3 text-neutral-600 text-xs">
                    {voice.font}
                  </p>
                </div>
                <p className={cn("mt-3 text-ink", ...sample)}>
                  {voice.sample}
                </p>
              </div>
            );
          })}
        </div>
        <TypeVoicePortraits
          documentaryAlt={copy.images.rules[2].alt}
          editorialAlt={copy.images.rules[4].alt}
          voices={copy.voices}
        />
      </div>
      <TypeOnImageExamples copy={copy.images} />
    </>
  );
}
