import type { DesignSystemTitledTextDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface VoiceStoriesCardProps {
  copy: DesignSystemTitledTextDict;
}

export function VoiceStoriesCard({ copy }: VoiceStoriesCardProps) {
  return (
    <aside
      className={cn("bg-secondary p-5 rounded-xl", "md:max-w-md")}
      data-voice-stories
    >
      <p className="font-semibold text-ink text-xs tracking-widest uppercase">
        {copy.title}
      </p>
      <p className="mt-3 text-ink text-sm">{copy.body}</p>
    </aside>
  );
}
