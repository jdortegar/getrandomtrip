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
  {
    name: "Viator",
    src: "/images/partners/viator.png",
    width: 572,
    height: 145,
    heightClass: "h-6 md:h-7",
  },
  {
    name: "Booking.com",
    src: "/images/partners/booking.png",
    width: 587,
    height: 98,
    heightClass: "h-5 md:h-6",
  },
  {
    name: "Duffel",
    src: "/images/partners/duffel.png",
    width: 544,
    height: 128,
    heightClass: "h-5 md:h-[23px]",
  },
  {
    name: "GetYourGuide",
    src: "/images/partners/getyourguide.png",
    width: 592,
    height: 468,
    heightClass: "h-11 md:h-[53px]",
  },
  {
    // Official Stripe wordmark (Stripe logo kit, Slate), fill set to the
    // strip's #7E7E7E grey so it matches the other marks.
    name: "Stripe",
    src: "/images/partners/stripe.svg",
    width: 360,
    height: 151,
    heightClass: "h-7 md:h-8",
  },
] as const;

export function PartnersSection({ copy }: PartnersSectionProps) {
  return (
    <section
      aria-labelledby="partners-heading"
      className="bg-neutral-50 pb-5 pt-8"
      data-component="PartnersSection"
      id="partners"
    >
      <h2
        className="font-semibold text-center text-neutral-500 text-xs tracking-[0.18em] uppercase"
        id="partners-heading"
      >
        {copy.title}
      </h2>
      {/*
        Mobile: one row that autoplays as a seamless loop (the list is rendered
        twice and slides by half its width). Tablet and up: a static centered
        row. Reduced motion: no animation, the row scrolls by swiping instead.
      */}
      <div
        className={cn(
          "overflow-hidden motion-reduce:overflow-x-auto",
          "[mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]",
          "md:overflow-visible md:[mask-image:none]",
        )}
      >
        <ul
          className={cn(
            "flex w-max items-center py-6",
            "animate-[infinite-scroll_20s_linear_infinite] motion-reduce:animate-none",
            "md:mx-auto md:w-full md:max-w-[1240px] md:min-h-[96px] md:animate-none md:justify-center md:gap-x-10 md:px-6 md:py-0",
            "lg:gap-x-24 xl:gap-x-[160px]",
          )}
        >
          {[false, true].flatMap((isLoopCopy) =>
            PARTNERS.map((partner) => (
              <li
                aria-hidden={isLoopCopy || undefined}
                className={cn(
                  "flex shrink-0 items-center justify-center px-7 md:px-0",
                  isLoopCopy && "motion-reduce:hidden md:hidden",
                )}
                key={`${partner.name}${isLoopCopy ? "-loop" : ""}`}
              >
                <Img
                  alt={isLoopCopy ? "" : partner.name}
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
            )),
          )}
        </ul>
      </div>
    </section>
  );
}
