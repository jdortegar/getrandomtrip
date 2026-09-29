import { ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeading } from "@/components/layout/PageHeading";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface GalleryHeroProps {
  copy: DesignSystemDict["hero"];
}

export function GalleryHero({ copy }: GalleryHeroProps) {
  return (
    <div
      className={cn("gap-10 grid py-12", "lg:grid-cols-[1.6fr_1fr] lg:py-20")}
    >
      <div>
        <PageHeading
          description={copy.description}
          eyebrow={copy.eyebrow}
          title={copy.title}
        />
        <Button asChild>
          <a href="#foundations">
            {copy.explore}
            <ArrowDownRight aria-hidden className="h-4 w-4" />
          </a>
        </Button>
        <p className="mt-5 text-neutral-600 text-sm">{copy.localOnly}</p>
      </div>
      <aside
        aria-label={copy.overview}
        className="bg-secondary flex flex-col justify-between p-6 rounded-xl"
      >
        <p className="font-semibold text-ink text-xs tracking-widest uppercase">
          {copy.overview}
        </p>
        <dl className="divide-ink/20 divide-y mt-5">
          {copy.facts.map(({ label, value }) => (
            <div
              className="flex flex-wrap gap-2 items-baseline justify-between py-4"
              key={label}
            >
              <dt className="text-sm">{label}</dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <div aria-hidden className="flex gap-2 mt-6">
          <span className="bg-ground h-2 rounded-full w-3/5" />
          <span className="bg-white h-2 rounded-full w-1/4" />
          <span className="bg-primary h-2 rounded-full w-1/12" />
          <span className="bg-feature h-2 rounded-full w-1/12" />
        </div>
      </aside>
    </div>
  );
}
