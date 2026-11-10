import { SectionSubtitle } from "@/components/app/design-system/SectionSubtitle";
import { cn } from "@/lib/utils";

interface PhotographyIntroProps {
  body: string;
  lead: string;
  title: string;
}

export function PhotographyIntro({ body, lead, title }: PhotographyIntroProps) {
  return (
    <div className={cn("gap-4 grid mb-6", "md:grid-cols-2 md:items-end")}>
      <div>
        <h3 className="font-barlow-condensed font-bold leading-none text-3xl text-primary uppercase">
          {title}
        </h3>
        <SectionSubtitle>{lead}</SectionSubtitle>
      </div>
      <p className="text-neutral-700 text-sm">{body}</p>
    </div>
  );
}
