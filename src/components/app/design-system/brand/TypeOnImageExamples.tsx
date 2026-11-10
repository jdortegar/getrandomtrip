import { SectionSubtitle } from "@/components/app/design-system/SectionSubtitle";
import { TypeOnImageCard } from "@/components/app/design-system/brand/TypeOnImageCard";
import { TYPE_ON_IMAGE_EXAMPLES } from "@/lib/constants/BRAND_BOOK_PHOTOS";
import type { DesignSystemTypographyDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface TypeOnImageExamplesProps {
  copy: DesignSystemTypographyDict["images"];
}

export function TypeOnImageExamples({ copy }: TypeOnImageExamplesProps) {
  return (
    <div className="mt-10">
      <div className={cn("gap-4 grid mb-6", "md:grid-cols-2 md:items-end")}>
        <div>
          <h3 className="font-semibold text-xl">{copy.title}</h3>
          <SectionSubtitle>{copy.lead}</SectionSubtitle>
        </div>
        <p className="text-neutral-700 text-sm">{copy.body}</p>
      </div>
      <ol className={cn("gap-4 grid", "lg:grid-cols-2")}>
        {copy.rules.map((rule, index) => {
          const examples = TYPE_ON_IMAGE_EXAMPLES[index];
          if (!examples) return null;
          return (
            <TypeOnImageCard
              copy={rule}
              fails={examples.fails}
              failsLabel={copy.failsLabel}
              key={rule.title}
              works={examples.works}
              worksLabel={copy.worksLabel}
            />
          );
        })}
      </ol>
      <div className={cn("gap-4 grid mt-4", "md:grid-cols-2")}>
        {[copy.principles, copy.decorative].map((note) => (
          <div className="bg-secondary p-6 rounded-xl" key={note.title}>
            <p className="font-semibold text-ink text-xs tracking-widest uppercase">
              {note.title}
            </p>
            <p className="mt-3 text-ink text-sm">{note.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
