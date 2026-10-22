import BrandingAnimation from "@/components/BrandingAnimation";
import { SectionSubtitle } from "@/components/app/design-system/SectionSubtitle";
import { PayoffTiles } from "@/components/app/design-system/brand/PayoffTiles";
import { VoiceCard } from "@/components/app/design-system/brand/VoiceCard";
import { VoiceTraitCell } from "@/components/app/design-system/brand/VoiceTraitCell";
import type { DesignSystemVoiceDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface BrandVoiceProps {
  copy: DesignSystemVoiceDict;
}

export function BrandVoice({ copy }: BrandVoiceProps) {
  const { payoffs } = copy;
  return (
    <>
      <p
        className="font-semibold text-primary text-xs tracking-widest uppercase"
        data-voice-character
      >
        {copy.characterLabel}
      </p>
      <div
        className={cn("gap-6 grid mt-4", "sm:grid-cols-2", "lg:grid-cols-4")}
      >
        {copy.cards.map((card) => (
          <VoiceTraitCell card={card} key={card.trait} />
        ))}
      </div>
      <div className="border-gray-200 border-t mt-8 pt-4">
        <p
          className="font-semibold text-primary text-xs tracking-widest uppercase"
          data-voice-tone
        >
          {copy.toneLabel}
        </p>
        <div
          className={cn("gap-8 grid mt-4", "sm:grid-cols-2", "lg:grid-cols-4")}
        >
          {copy.cards.map((card, index) => (
            <VoiceCard
              card={card}
              className={cn(
                index > 0 && "lg:border-gray-200 lg:border-l lg:pl-6",
              )}
              failsLabel={copy.failsLabel}
              key={card.trait}
              worksLabel={copy.worksLabel}
            />
          ))}
        </div>
      </div>
      <div className="mt-12">
        <div className={cn("gap-4 grid mb-6", "md:grid-cols-2 md:items-end")}>
          <div>
            <h3 className="font-barlow-condensed font-bold leading-none text-3xl text-primary uppercase">
              {payoffs.title}
            </h3>
            <SectionSubtitle className="text-ink">
              {payoffs.subtitle}
            </SectionSubtitle>
          </div>
          <p className="text-neutral-700 text-sm">{payoffs.body}</p>
        </div>
        <PayoffTiles copy={payoffs} />
        <div
          className={cn(
            "bg-white border border-gray-200 gap-6 grid items-center mt-4 p-6 rounded-xl",
            "lg:grid-cols-[auto_1fr_1fr_1fr]",
          )}
        >
          <p className="font-nothing-you-could-do text-2xl text-primary">
            {payoffs.signature.label}
          </p>
          <div
            className="origin-left w-max [zoom:0.5]"
            data-signature-lockup
          >
            <BrandingAnimation className="text-primary" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-primary text-xs tracking-widest uppercase">
              {payoffs.purposeLabel}
            </p>
            <p className="mt-1 text-neutral-700">{payoffs.signature.purpose}</p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-primary text-xs tracking-widest uppercase">
              {payoffs.useLabel}
            </p>
            <p className="mt-1 text-neutral-700">{payoffs.signature.use}</p>
          </div>
        </div>
        <div className="bg-secondary mt-4 p-6 rounded-xl">
          <p className="font-semibold text-ink text-xs tracking-widest uppercase">
            {payoffs.rule.title}
          </p>
          <p className="max-w-3xl mt-3 text-ink text-sm">{payoffs.rule.body}</p>
        </div>
      </div>
    </>
  );
}
