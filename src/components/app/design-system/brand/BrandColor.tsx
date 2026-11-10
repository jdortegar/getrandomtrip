import { TokenSwatch } from "@/components/app/design-system/TokenSwatch";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import { ColorMappingTable } from "@/components/app/design-system/brand/ColorMappingTable";
import { ColorRatioBar } from "@/components/app/design-system/brand/ColorRatioBar";
import type {
  DesignSystemColorDict,
  DesignSystemSwatchKey,
} from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface BrandColorProps {
  copy: DesignSystemColorDict;
  usageLabel: string;
}

const tiers: {
  tier: keyof DesignSystemColorDict["tiers"];
  swatches: [DesignSystemSwatchKey, string, string][];
}[] = [
  {
    tier: "core",
    swatches: [
      ["offWhite", "--color-off-white", "#F3F2ED"],
      ["mineralSage", "--color-mineral-sage", "#A4B4AA"],
      ["deepTeal", "--color-deep-teal", "#0F5C60"],
      ["ochre", "--color-ochre", "#E5A51C"],
    ],
  },
  {
    tier: "dark",
    swatches: [
      ["deepTealDark", "--color-deep-teal-dark", "#082E30"],
      ["sageDark", "--color-sage-dark", "#4D5E54"],
    ],
  },
  {
    tier: "secondary",
    swatches: [
      ["canyonClay", "--color-canyon-clay", "#D97E4A"],
      ["skyDrift", "--color-sky-drift", "#6BAAC9"],
    ],
  },
  {
    tier: "ui",
    swatches: [
      ["ink", "--color-ink", "#383838"],
      ["surface", "--color-white", "#FFFFFF"],
    ],
  },
];

function rgbOf(hex: string) {
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
}

export function BrandColor({ copy, usageLabel }: BrandColorProps) {
  return (
    <>
      <div className={cn("gap-6 grid mb-10", "md:grid-cols-2")}>
        <div>
          <p className="font-barlow-condensed font-bold leading-tight text-2xl uppercase">
            {copy.intro.title}
          </p>
          <p className="mt-3 text-neutral-700 text-sm">{copy.intro.body}</p>
        </div>
        <div className="bg-secondary p-6 rounded-xl">
          <p className="font-semibold text-ink text-xs tracking-widest uppercase">
            {copy.signal.title}
          </p>
          <p className="mt-3 text-ink text-sm">{copy.signal.body}</p>
        </div>
      </div>
      {tiers.map(({ tier, swatches }) => (
        <div className="mb-6" key={tier}>
          <h3 className="font-semibold mb-4 text-xl">{copy.tiers[tier]}</h3>
          <div
            className={cn(
              "gap-4 grid grid-cols-1",
              "sm:grid-cols-2",
              tier === "core" && "lg:grid-cols-4",
            )}
          >
            {swatches.map(([key, token, fallback]) => (
              <TokenSwatch
                copy={copy.clipboard}
                fallback={fallback}
                key={token}
                name={copy.swatches[key].name}
                rgb={`${copy.rgbLabel} ${rgbOf(fallback).join(" ")}`}
                token={token}
                traits={copy.swatches[key].traits || undefined}
                usage={copy.swatches[key].usage}
              />
            ))}
          </div>
        </div>
      ))}
      <ColorRatioBar copy={copy} />
      <div className="mt-6">
        <ColorMappingTable copy={copy} />
      </div>
      <UsageExample
        code={`// UI code: role tokens
<button className="bg-primary text-white" />
<section className="bg-secondary text-ink" />
<a className="bg-feature text-ink" />

// Roleless palette colors, only where the brand allows them
<p className="text-deep-teal-dark">…</p> // text over a light image

// Never: a palette name where a role token exists
<button className="bg-deep-teal" /> // use bg-primary`}
        label={usageLabel}
      />
    </>
  );
}
