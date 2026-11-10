import AvatarWithFallback from "@/components/ui/AvatarWithFallback";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface AvatarExamplesProps {
  copy: DesignSystemDict;
}

const sizes = ["sm", "md", "lg", "xl"] as const;

export function AvatarExamples({ copy }: AvatarExamplesProps) {
  const labels = copy.avatar;
  return (
    <>
      <div className={cn("gap-6 grid", "lg:grid-cols-2")}>
        <GalleryPanel title={labels.photo}>
          <div className="flex flex-wrap gap-4 items-end">
            {sizes.map((size) => (
              <AvatarWithFallback
                alt={labels.photoAlt}
                key={size}
                size={size}
                src="/images/brand-book/lucia.jpg"
              />
            ))}
          </div>
        </GalleryPanel>
        <GalleryPanel title={labels.fallback}>
          <div className="flex flex-wrap gap-4 items-end">
            {sizes.map((size) => (
              <AvatarWithFallback alt={labels.fallback} key={size} size={size} />
            ))}
          </div>
        </GalleryPanel>
      </div>
      <UsageExample
        code={`<AvatarWithFallback alt={copy.name} size="md" src={copy.photo} />
<AvatarWithFallback alt={copy.name} size="md" />`}
        label={copy.usage}
      />
    </>
  );
}
