import { Compass, Globe, Heart, Lock } from "lucide-react";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface TrustSignalProps {
  copy: MarketingDictionary["home"]["trustSignal"];
}

export function TrustSignal({ copy }: TrustSignalProps) {
  const signals = [
    { copy: copy.curated, Icon: Compass, key: "curated" },
    { copy: copy.trippers, Icon: Heart, key: "trippers" },
    { copy: copy.effortless, Icon: Lock, key: "effortless" },
    { copy: copy.discovery, Icon: Globe, key: "discovery" },
  ];

  return (
    <section
      aria-label={copy.sectionAriaLabel}
      className="bg-secondary text-[#082E30]"
      data-component="TrustSignal"
    >
      <ul
        className={cn(
          "gap-x-8 gap-y-10 grid grid-cols-1 max-w-[1440px] mx-auto px-6 py-12",
          "sm:grid-cols-2 sm:px-10",
          "lg:gap-x-8 lg:grid-cols-4 lg:min-h-[246px] lg:pb-[62px] lg:pt-16 lg:px-24",
        )}
      >
        {signals.map(({ copy: signal, Icon, key }) => (
          <li className={cn("text-center", "sm:text-left")} key={key}>
            <div
              className={cn(
                "flex gap-3 items-end justify-center",
                "sm:justify-start",
              )}
            >
              <h2
                className={cn(
                  "font-barlow-condensed font-bold text-[22px] tracking-[0.5px] uppercase",
                  "leading-[24px]",
                )}
              >
                {signal.title}
              </h2>
              <Icon
                aria-hidden="true"
                className="h-12 shrink-0 text-primary w-12"
                focusable="false"
                strokeWidth={1.25}
              />
            </div>
            <p className="font-normal mt-2.5 text-lg leading-[22px]">
              {signal.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
