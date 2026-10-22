import { BrandIndexLabel } from "@/components/app/design-system/brand/BrandIndexLabel";
import Img from "@/components/common/Img";
import { PAYOFF_EXAMPLES } from "@/lib/constants/BRAND_BOOK_PHOTOS";
import type { DesignSystemVoiceDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface PayoffTilesProps {
  copy: DesignSystemVoiceDict["payoffs"];
}

const editorial =
  "font-barlow-condensed font-bold leading-[0.9] text-[2.5rem] uppercase";
const human = "font-nothing-you-could-do leading-snug text-[2rem]";

const tiles = [
  { key: "philosophy", font: editorial },
  { key: "benefit", font: editorial },
  { key: "promise", font: editorial },
  { key: "emotion", font: human },
  { key: "differentiator", font: editorial },
] as const;

export function PayoffTiles({ copy }: PayoffTilesProps) {
  return (
    <ol className={cn("gap-4 grid", "sm:grid-cols-2", "xl:grid-cols-5")}>
      {tiles.map(({ key, font }) => {
        const item = copy.items[key];
        return (
          <li
            className="bg-white border border-gray-200 flex flex-col overflow-hidden rounded-xl"
            data-payoff={key}
            key={key}
          >
            <BrandIndexLabel className="px-4 pt-4">{item.label}</BrandIndexLabel>
            <div className="mt-3 px-4">
              <div className="aspect-[76/109] overflow-hidden rounded-lg">
                <Img
                  alt={item.text.replace(/\s+/g, " ")}
                  className="h-full object-contain w-full"
                  height={654}
                  sizes="(min-width: 1280px) 20vw, (min-width: 640px) 50vw, 100vw"
                  src={PAYOFF_EXAMPLES[key]}
                  unoptimized
                  width={456}
                />
              </div>
            </div>
            <p className={cn("sr-only", font)} data-payoff-text>
              {item.text}
            </p>
            {"accent" in item && <p className="sr-only">{item.accent}</p>}
            <dl className="flex flex-col gap-3 p-4 text-sm">
              <div>
                <dt className="font-semibold text-primary text-xs tracking-widest uppercase">
                  {copy.purposeLabel}
                </dt>
                <dd className="mt-1 text-neutral-700">{item.purpose}</dd>
              </div>
              <div>
                <dt className="font-semibold text-primary text-xs tracking-widest uppercase">
                  {copy.useLabel}
                </dt>
                <dd className="mt-1 text-neutral-700">{item.use}</dd>
              </div>
            </dl>
          </li>
        );
      })}
    </ol>
  );
}
