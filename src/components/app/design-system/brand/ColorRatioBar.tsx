import type {
  DesignSystemColorDict,
  DesignSystemRatioKey,
} from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface ColorRatioBarProps {
  copy: DesignSystemColorDict;
}

// Grow factors use each color's upper share so the bar reads at a glance.
const ratio: {
  key: DesignSystemRatioKey;
  share: number;
  fill: string;
}[] = [
  { key: "offWhite", share: 60, fill: "bg-off-white" },
  { key: "mineralSage", share: 30, fill: "bg-mineral-sage" },
  { key: "deepTeal", share: 10, fill: "bg-deep-teal" },
  { key: "ochre", share: 5, fill: "bg-ochre" },
];

export function ColorRatioBar({ copy }: ColorRatioBarProps) {
  return (
    <div className="bg-white border border-gray-200 p-6 rounded-xl">
      <h3 className="font-semibold text-xl">{copy.ratio.title}</h3>
      <p className="max-w-2xl mt-1 text-neutral-600 text-sm">
        {copy.ratio.description}
      </p>
      <div
        aria-hidden
        className="border border-gray-200 flex h-10 mt-6 overflow-hidden rounded-lg"
        data-ratio-bar
      >
        {ratio.map(({ key, share, fill }) => (
          <span
            className={cn("block h-full", fill)}
            data-share={share}
            key={key}
            style={{ flexGrow: share }}
          />
        ))}
      </div>
      <dl className={cn("gap-5 grid mt-6", "sm:grid-cols-2", "lg:grid-cols-4")}>
        {ratio.map(({ key, fill }) => {
          const item = copy.ratio.items[key];
          return (
            <div key={key}>
              <dt className="flex gap-2 items-center">
                <span
                  aria-hidden
                  className={cn(
                    "border border-gray-300 h-3 rounded-full shrink-0 w-3",
                    fill,
                  )}
                />
                <span
                  className="font-barlow-condensed font-bold shrink-0 text-2xl whitespace-nowrap"
                  data-ratio-share
                >
                  {item.share}
                </span>
                <span className="font-semibold text-neutral-600 text-xs tracking-widest uppercase">
                  {item.label} · {copy.swatches[key].name}
                </span>
              </dt>
              <dd className="mt-2 text-neutral-700 text-sm">{item.usage}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
