import type { Metadata } from 'next';
import { FaqBlock } from '@/components/display/FaqBlock';
import HeaderHero from '@/components/journey/HeaderHero';
import { hasLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import Section from '@/components/layout/Section';

type LocaleParams = { params: Promise<{ locale?: string | string[] }> };

function resolveLocale(raw: string | string[] | undefined): Locale {
  const localeStr = typeof raw === 'string' ? raw : raw?.[0];
  return hasLocale(localeStr) ? localeStr : 'es';
}

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const params = await props.params;
  const locale = resolveLocale(params?.locale);
  const dict = await getDictionary(locale);
  const meta = dict.faqPage.meta;
  return {
    description: meta.description,
    openGraph: {
      description: meta.openGraphDescription,
      title: meta.openGraphTitle,
      type: 'website',
    },
    title: meta.title,
  };
}

export default async function FaqPage(props: LocaleParams) {
  const params = await props.params;
  const locale = resolveLocale(params?.locale);
  const dict = await getDictionary(locale);
  const { hero, block } = dict.faqPage;

  return (
    <>
      <HeaderHero
        className="min-h-[40vh]!"
        description={hero.description}
        eyebrowColor="#F2C53D"
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle={hero.eyebrow}
        title={hero.title}
        videoSrc="/videos/hero-video-1.mp4"
      />
      <main>
        <Section>
          <FaqBlock copy={block} />
        </Section>
      </main>
    </>
  );
}
