import Img from "@/components/common/Img";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface PartnersSectionProps {
  copy: MarketingDictionary["home"]["partners"];
}

/**
 * Order and rendered logo heights follow the Figma "partners_" frame
 * (node 6207:11117) so each mark carries the same visual weight.
 */
const PARTNERS = [
  { name: "Viator", src: "/images/partners/viator.png", width: 572, height: 145, heightClass: "h-6 md:h-7" },
  { name: "Booking.com", src: "/images/partners/booking.png", width: 587, height: 98, heightClass: "h-5 md:h-6" },
  { name: "Duffel", src: "/images/partners/duffel.png", width: 544, height: 128, heightClass: "h-5 md:h-[23px]" },
  { name: "GetYourGuide", src: "/images/partners/getyourguide.png", width: 592, height: 468, heightClass: "h-11 md:h-[53px]" },
] as const;

export function PartnersSection({ copy }: PartnersSectionProps) {
  return (
    <section
      aria-label={copy.sectionAriaLabel}
      className="bg-neutral-50"
      data-component="PartnersSection"
      id="partners"
    >
      <ul
        className={cn(
          "gap-y-6 grid grid-cols-2 items-center max-w-[1240px] mx-auto px-6 py-6",
          "md:grid-cols-4 md:min-h-[104px] md:py-0",
          "lg:flex lg:gap-x-[180px] lg:justify-center",
        )}
      >
        {PARTNERS.map((partner) => (
          <li className="flex items-center justify-center" key={partner.name}>
            <Img
              alt={partner.name}
              className={cn(
                "opacity-60 transition-opacity duration-300 w-auto hover:opacity-100",
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
    </section>
  );
}
