import { Compass, Route, Sparkles } from "lucide-react";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface IconExamplesProps {
  copy: DesignSystemDict;
}

const icons = [
  { Icon: Compass, id: "compass" },
  { Icon: Route, id: "route" },
  { Icon: Sparkles, id: "sparkles" },
];

export function IconExamples({ copy }: IconExamplesProps) {
  const labels = copy.icons;
  return (
    <>
      <div className={cn("gap-6 grid", "lg:grid-cols-2")}>
        <GalleryPanel title={labels.inline}>
          <div className="flex gap-4 items-center text-primary">
            {icons.map(({ Icon, id }) => (
              <Icon aria-hidden className="h-4 w-4" key={id} />
            ))}
          </div>
        </GalleryPanel>
        <GalleryPanel title={labels.puck}>
          <div className="flex gap-4 items-center">
            {icons.map(({ Icon, id }) => (
              <div
                className="bg-accent flex h-9 items-center justify-center rounded-full text-primary w-9"
                key={id}
              >
                <Icon aria-hidden className="h-4 w-4" />
              </div>
            ))}
          </div>
        </GalleryPanel>
      </div>
      <p className="mt-4 text-neutral-600 text-sm">{labels.hint}</p>
      <UsageExample
        code={`<Compass className="h-4 w-4" />
<div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-primary">
  <Compass className="h-4 w-4" />
</div>`}
        label={copy.usage}
      />
    </>
  );
}
