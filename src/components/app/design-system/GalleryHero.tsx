import { PageHeading } from "@/components/layout/PageHeading";
import type { DesignSystemHeroDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface GalleryHeroProps {
  agentDocsHref: string;
  agentDocsLabel: string;
  copy: DesignSystemHeroDict;
}

export function GalleryHero({
  agentDocsHref,
  agentDocsLabel,
  copy,
}: GalleryHeroProps) {
  return (
    <div
      className={cn("max-w-3xl py-12", "lg:py-20")}
      data-gallery-hero
    >
      <PageHeading
        description={copy.description}
        eyebrow={copy.eyebrow}
        title={copy.title}
      />
      <p className="text-neutral-600 text-sm">{copy.localOnly}</p>
      <p className="mt-5">
        <a
          className="font-mono text-primary text-sm underline"
          href={agentDocsHref}
        >
          {agentDocsLabel}
        </a>
      </p>
    </div>
  );
}
