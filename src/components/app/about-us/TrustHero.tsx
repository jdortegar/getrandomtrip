import Link from "next/link";
import SafeImage from "@/components/common/SafeImage";
import Img from "@/components/common/Img";
import { Button } from "@/components/ui/Button";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";

const FEATURE_ICONS = [
  "/assets/svg/price.svg",
  "/assets/svg/secure.svg",
  "/assets/svg/support.svg",
] as const;

interface TrustFeatureItem {
  description: string;
  title: string;
}

interface TrustHeroContent {
  backgroundImage: string;
  ctaAriaLabel: string;
  ctaLabel: string;
  headline: string;
  items: TrustFeatureItem[];
  subtitle: string;
}

interface TrustHeroProps {
  content: TrustHeroContent;
  locale: Locale;
}

export function TrustHero({ content, locale }: TrustHeroProps) {
  return (
    <section className="relative min-h-[60vh] w-full overflow-hidden">
      <SafeImage
        alt=""
        aria-hidden="true"
        className="object-cover"
        fill
        sizes="100vw"
        src={content.backgroundImage}
      />

      <div className="relative z-10 flex h-full min-h-[60vh] flex-col justify-between px-6 py-12 sm:px-12 md:px-16 md:py-20">
        <div className="max-w-3xl">
          <h2 className="text-center md:text-left font-barlow-condensed text-[56px] font-bold uppercase leading-none tracking-tight text-white sm:text-[64px]">
            {content.headline}
          </h2>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-end">
          <div className="max-w-md flex flex-col items-center md:items-start">
            <p className="font-barlow text-lg font-normal leading-relaxed text-white">
              {content.subtitle}
            </p>
            <Button
              asChild
              aria-label={content.ctaAriaLabel}
              className="mt-6 text-gray-900"
              size="lg"
              variant="white"
            >
              <Link
                href={pathForLocale(locale, "/#exploration-section")}
                scroll={true}
              >
                {content.ctaLabel}
              </Link>
            </Button>
          </div>

          <div className="rounded-2xl bg-black/35 backdrop-blur-md md:ml-auto md:w-2/3 max-h-56">
            <div className="flex flex-col md:flex-row">
              {content.items.map((item, i) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 p-3 md:max-w-1/3 after:content-[''] after:block after:w-px after:h-full after:bg-white/75 last:after:hidden"
                >
                  <Img
                    alt=""
                    aria-hidden="true"
                    className="h-6 w-auto"
                    height={24}
                    src={FEATURE_ICONS[i]}
                    width={24}
                  />

                  <p className="font-barlow text-sm leading-relaxed text-white">
                    <span className="font-bold">{item.title}: </span>
                    <span className="font-normal text-white/85">
                      {item.description}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
