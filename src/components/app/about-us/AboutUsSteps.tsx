import Link from "next/link";
import Img from "@/components/common/Img";
import Section from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICONS = [
  { src: "/assets/svg/limit.svg", width: 39, height: 51 },
  { src: "/assets/svg/path.svg", width: 48, height: 49 },
  { src: "/assets/svg/reveal.svg", width: 50, height: 50 },
] as const;

interface StepItem {
  description: string;
  key: string;
  title: string;
}

interface AboutUsStepsContent {
  eyebrow: string;
  items: StepItem[];
  sectionTitle: string;
  stepLabel: string;
}

interface AboutUsStepsCta {
  buttonAriaLabel: string;
  buttonText: string;
}

interface AboutUsStepsProps {
  content: AboutUsStepsContent;
  cta: AboutUsStepsCta;
  locale: Locale;
}

export function AboutUsSteps({ content, cta, locale }: AboutUsStepsProps) {
  return (
    <Section title={content.sectionTitle} eyebrow={content.eyebrow}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mt-4 px-10">
        {content.items.map((step, i) => {
          const icon = ICONS[i];
          return (
            <div
              key={step.key}
              className="flex flex-col gap-3 lg:border-l lg:border-gray-200 lg:px-12 lg:first:border-l-0 lg:first:pl-0 text-center lg:text-left items-center lg:items-start"
            >
              {icon && (
                <Img
                  alt=""
                  aria-hidden="true"
                  className="h-12 w-auto shrink-0 mb-2"
                  height={icon.height}
                  src={icon.src}
                  width={icon.width}
                />
              )}
              <h3 className="font-barlow-condensed text-3xl font-semibold uppercase leading-none text-gray-900">
                {step.title}
              </h3>
              <p className="font-barlow text-lg text-neutral-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-12 flex justify-center">
        <Button asChild size="lg" variant="feature">
          <Link
            href={pathForLocale(locale, "/#exploration-section")}
            aria-label={cta.buttonAriaLabel}
          >
            {cta.buttonText}
          </Link>
        </Button>
      </div>
    </Section>
  );
}
