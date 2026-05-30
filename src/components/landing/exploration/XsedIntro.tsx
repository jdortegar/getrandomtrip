"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useDictionary } from "@/hooks/useDictionary";

export function XsedIntro() {
  const copy = useDictionary((d) => d.home.exploration.xsedIntro);

  return (
    <div className="relative w-full overflow-hidden rt-container min-h-96 rounded-lg">
      {/* Background image */}
      <div className="relative">
        <div
          className="absolute inset-0 bg-cover bg-center rounded-lg"
          style={{ backgroundImage: `url(${copy.backgroundImage})` }}
        />

        <div className="absolute inset-0 bg-black/45 rounded-lg" />

        {/* Content */}
        <div className="text-left relative z-10 flex h-full min-h-[420px] flex-col justify-center px-10 md:px-16 lg:px-24">
          <p className="tracking-[2px] md:tracking-[6px] mb-2 font-barlow text-xs font-bold uppercase text-white">
            {copy.eyebrow}
          </p>
          <h3 className="mb-4 max-w-xl font-barlow-condensed text-5xl font-bold leading-none text-white md:text-5xl">
            {copy.title}
          </h3>
          <p className="mb-8 max-w-lg text-sm leading-relaxed text-white/85">
            {copy.description}
          </p>

          <Button asChild size="lg" variant="tertiary" className="mr-auto">
            <Link href={copy.ctaHref}>{copy.ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
