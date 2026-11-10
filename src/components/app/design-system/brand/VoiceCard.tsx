import { WorksFailsLabel } from "@/components/app/design-system/brand/WorksFailsLabel";
import type { DesignSystemVoiceDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface VoiceCardProps {
  card: DesignSystemVoiceDict["cards"][number];
  className?: string;
  failsLabel: string;
  worksLabel: string;
}

export function VoiceCard({
  card,
  className,
  failsLabel,
  worksLabel,
}: VoiceCardProps) {
  return (
    <article className={cn("flex flex-col", className)} data-voice-card>
      <h5 className="font-barlow-condensed font-bold leading-tight text-ink text-xl uppercase">
        {card.voice}
      </h5>
      <div className="flex flex-col gap-4 mt-5">
        <div data-example="works">
          <WorksFailsLabel label={worksLabel} variant="works" />
          <p className="font-nothing-you-could-do leading-snug mt-2 text-ink text-xl">
            {card.works}
          </p>
        </div>
        <div data-example="fails">
          <WorksFailsLabel label={failsLabel} variant="fails" />
          <p className="mt-2 text-neutral-700 text-sm">{card.fails}</p>
        </div>
      </div>
    </article>
  );
}
