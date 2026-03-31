import Link from 'next/link';
import HeaderHero from '@/components/journey/HeaderHero';
import type { Locale } from '@/lib/i18n/config';
import { pathForLocale } from '@/lib/i18n/pathForLocale';
import type { LegalDocumentDict } from '@/lib/types/dictionary';
import { cn } from '@/lib/utils';

interface LegalDocumentPageProps {
  document: LegalDocumentDict;
  locale: Locale;
}

export function LegalDocumentPage({ document: doc, locale }: LegalDocumentPageProps) {
  const { hero } = doc;

  return (
    <>
      <HeaderHero
        className="!min-h-[40vh]"
        description={hero.description}
        eyebrowColor="#F2C53D"
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle={hero.eyebrow}
        title={hero.title}
        videoSrc="/videos/hero-video-1.mp4"
      />

      <main
        className={cn(
          'container mx-auto max-w-4xl px-4 py-12 text-neutral-700',
          'md:px-20 md:py-16',
        )}
      >
        <div className="space-y-8">
          {doc.sections.map((section, index) => (
            <section key={index}>
              <h2
                className={cn(
                  'mb-3 font-barlow-condensed text-xl font-semibold text-neutral-900',
                )}
              >
                {section.title}
              </h2>
              {section.paragraphs?.map((paragraph, pIndex) => (
                <p className="mb-3 leading-relaxed last:mb-0" key={pIndex}>
                  {paragraph}
                </p>
              ))}
              {section.listIntro ? (
                <p className="mb-2 leading-relaxed">{section.listIntro}</p>
              ) : null}
              {section.listItems && section.listItems.length > 0 ? (
                <ul className="list-disc space-y-2 pl-6">
                  {section.listItems.map((item, liIndex) => (
                    <li className="leading-relaxed" key={liIndex}>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
        {doc.contactBlock ? (
          <section className="mt-10 border-t border-neutral-200 pt-8">
            <h2
              className={cn(
                'mb-3 font-barlow-condensed text-xl font-semibold text-neutral-900',
              )}
            >
              {doc.contactBlock.title}
            </h2>
            <p className="leading-relaxed">
              {doc.contactBlock.before}{' '}
              <Link
                className="text-primary underline-offset-2 hover:underline"
                href={pathForLocale(locale, '/contact')}
              >
                {doc.contactBlock.linkLabel}
              </Link>
              {doc.contactBlock.after}
            </p>
          </section>
        ) : null}
      </main>
    </>
  );
}
