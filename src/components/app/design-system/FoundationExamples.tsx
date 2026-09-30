import { TokenSwatch } from "@/components/app/design-system/TokenSwatch";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface FoundationExamplesProps {
  copy: DesignSystemDict;
}

const tokens = [
  ["primary", "--color-primary", "#0F5C60"],
  ["secondary", "--color-secondary", "#A4B4AA"],
  ["feature", "--color-feature", "#E5A51C"],
  ["ground", "--color-ground", "#F3F2ED"],
  ["surface", "--color-white", "#FFFFFF"],
  ["ink", "--color-ink", "#383838"],
] as const;

export function FoundationExamples({ copy }: FoundationExamplesProps) {
  return (
    <>
      <div className={cn("gap-4 grid grid-cols-2", "lg:grid-cols-3")}>
        {tokens.map(([key, token, fallback]) => (
          <TokenSwatch
            copy={copy.foundations.clipboard}
            fallback={fallback}
            key={token}
            name={copy.foundations.colors[key].name}
            token={token}
            usage={copy.foundations.colors[key].usage}
          />
        ))}
      </div>
      <p className="mb-8 text-neutral-600 text-sm">
        {copy.foundations.paletteNote}
      </p>
      <div className="bg-white border border-gray-200 divide-gray-200 divide-y overflow-hidden rounded-xl">
        <div className="bg-accent p-6">
          <h3 className="font-semibold text-xl">
            {copy.foundations.typography}
          </h3>
          <p className="mt-1 text-neutral-600 text-sm">
            {copy.foundations.typeNote}
          </p>
        </div>
        <div
          className={cn(
            "gap-4 grid p-6",
            "md:grid-cols-[1fr_2fr] md:items-center",
          )}
        >
          <p className="font-mono text-neutral-600 text-xs">
            {copy.foundations.displayLabel}
          </p>
          <p
            className={cn(
              "font-barlow-condensed font-extrabold leading-none text-4xl uppercase",
              "sm:text-6xl",
            )}
          >
            {copy.foundations.displaySample}
          </p>
        </div>
        <div
          className={cn(
            "gap-4 grid p-6",
            "md:grid-cols-[1fr_2fr] md:items-center",
          )}
        >
          <p className="font-mono text-neutral-600 text-xs">
            {copy.foundations.headingLabel}
          </p>
          <p className="font-barlow-condensed font-extrabold leading-none text-3xl uppercase">
            {copy.foundations.headingSample}
          </p>
        </div>
        <div
          className={cn(
            "gap-4 grid p-6",
            "md:grid-cols-[1fr_2fr] md:items-center",
          )}
        >
          <p className="font-mono text-neutral-600 text-xs">
            {copy.foundations.bodyLabel}
          </p>
          <p className="leading-relaxed text-base text-neutral-700">
            {copy.foundations.bodySample}
          </p>
        </div>
        <div
          className={cn(
            "gap-4 grid p-6",
            "md:grid-cols-[1fr_2fr] md:items-center",
          )}
        >
          <p className="font-mono text-neutral-600 text-xs">
            {copy.foundations.captionLabel}
          </p>
          <p className="text-neutral-600 text-xs">
            {copy.foundations.captionSample}
          </p>
        </div>
      </div>
      <UsageExample
        code={`<h2 className="font-barlow-condensed text-3xl font-extrabold uppercase text-ink">
  {copy.title}
</h2>
<div className="bg-ground text-ink" />`}
        label={copy.usage}
      />
    </>
  );
}
