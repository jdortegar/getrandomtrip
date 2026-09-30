import { Compass, Route, Sparkles } from "lucide-react";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface LayoutExamplesProps {
  copy: DesignSystemDict;
}
const icons = [Compass, Route, Sparkles];

export function LayoutExamples({ copy }: LayoutExamplesProps) {
  const labels = copy.layout;
  return (
    <>
      <div className="bg-secondary rounded-xl rt-content-layout">
        <div className="py-6 rt-container">
          <p className="font-semibold text-primary text-xs tracking-widest uppercase">
            {labels.eyebrow}
          </p>
          <h3 className="font-barlow-condensed font-extrabold leading-none mt-3 text-3xl uppercase">
            {labels.title}
          </h3>
          <p className="max-w-2xl mt-4 text-sm">{labels.description}</p>
        </div>
      </div>
      <div className={cn("gap-6 grid mt-6", "md:grid-cols-3")}>
        {labels.cards.map((card, index) => {
          const Icon = icons[index];
          return (
            <div
              className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm"
              key={card.title}
            >
              <div className="bg-accent flex h-9 items-center justify-center rounded-full text-primary w-9">
                <Icon aria-hidden className="h-4 w-4" />
              </div>
              <h4 className="font-semibold mt-5 text-xl">{card.title}</h4>
              <p className="mt-3 text-neutral-600 text-sm">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-8">
        <h3 className="font-semibold mb-5 text-xl">{labels.spacing}</h3>
        <div
          aria-label={labels.spacing}
          className="flex flex-wrap gap-6 items-end"
        >
          {[4, 8, 12, 16, 24, 32, 48, 64].map((space) => (
            <div className="flex flex-col gap-3 items-center" key={space}>
              <div
                aria-hidden
                className="bg-secondary rounded-sm w-6"
                style={{ height: `calc(var(--spacing) * ${space / 4})` }}
              />
              <span className="font-mono text-neutral-600 text-xs">
                {space}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-neutral-600 text-sm">{labels.spacingHint}</p>
      </div>
      <UsageExample
        code={`<div className="rt-content-layout">
  <section className="bg-secondary">
    <div className="rt-container py-6">…</div>
  </section>
</div>`}
        label={copy.usage}
      />
    </>
  );
}
