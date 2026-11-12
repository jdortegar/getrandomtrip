import Img from "@/components/common/Img";
import Section from "@/components/layout/Section";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface PartnersSectionProps {
  copy: MarketingDictionary["home"]["partners"];
}

/**
 * Logo heights are tuned per mark so the wide wordmarks and the stacked
 * GetYourGuide logo carry similar visual weight in one row.
 */
const PARTNERS = [
  { name: "Booking.com", src: "/images/partners/booking.png", width: 587, height: 98, heightClass: "h-6 md:h-7" },
  { name: "GetYourGuide", src: "/images/partners/getyourguide.png", width: 592, height: 468, heightClass: "h-14 md:h-16" },
  { name: "Viator", src: "/images/partners/viator.png", width: 572, height: 145, heightClass: "h-8 md:h-9" },
  { name: "Duffel", src: "/images/partners/duffel.png", width: 544, height: 128, heightClass: "h-7 md:h-8" },
] as const;

export function PartnersSection({ copy }: PartnersSectionProps) {
  return (
    <Section id="partners" subtitle={copy.subtitle} title={copy.title}>
      <ul
        className={cn(
          "gap-x-8 gap-y-10 grid grid-cols-2 items-center",
          "md:flex md:justify-between",
        )}
        data-component="PartnersSection"
      >
        {PARTNERS.map((partner) => (
          <li className="flex items-center justify-center" key={partner.name}>
            <Img
              alt={partner.name}
              className={cn(
                "opacity-70 transition-opacity duration-300 w-auto hover:opacity-100",
                partner.heightClass,
              )}
              height={partner.height}
              sizes="200px"
              src={partner.src}
              width={partner.width}
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
