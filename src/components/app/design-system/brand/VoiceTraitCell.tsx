import type { DesignSystemVoiceDict } from "@/lib/types/dictionary";

interface VoiceTraitCellProps {
  card: DesignSystemVoiceDict["cards"][number];
}

export function VoiceTraitCell({ card }: VoiceTraitCellProps) {
  return (
    <div data-voice-trait>
      <h4 className="font-nothing-you-could-do text-2xl text-primary">
        {card.trait}
      </h4>
      <p className="mt-2 text-neutral-700 text-sm">{card.description}</p>
    </div>
  );
}
