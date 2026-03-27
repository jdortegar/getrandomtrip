import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/Button';
import HeaderHero from '@/components/journey/HeaderHero';
import Section from '@/components/layout/Section';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale } from '@/lib/i18n/config';
import { pathForLocale } from '@/lib/i18n/pathForLocale';

type LocaleParams = { params: { locale?: string | string[] } };

export async function generateMetadata({
  params,
}: LocaleParams): Promise<Metadata> {
  const raw = params?.locale;
  const locale = typeof raw === 'string' ? raw : raw?.[0];
  const dict = await getDictionary(hasLocale(locale) ? locale : 'es');
  const meta = dict.aboutUs.meta;
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

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-200 px-3 py-1 text-sm leading-none text-neutral-700">
      {children}
    </span>
  );
}

const PHILOSOPHY_IMAGE =
  'https://images.pexels.com/photos/21014/pexels-photo.jpg?auto=compress&cs=tinysrgb&dpr=1&w=1200';
const FOUNDER_IMAGE =
  'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=600';

export default async function AboutUsPage({ params }: LocaleParams) {
  const raw = params?.locale;
  const localeStr = typeof raw === 'string' ? raw : raw?.[0];
  const locale = hasLocale(localeStr) ? localeStr : 'es';
  const dict = await getDictionary(locale);
  const au = dict.aboutUs;
  const journeyHref = `${pathForLocale(locale as 'es' | 'en', '/')}?tab=By%20Traveller#start-your-journey-anchor`;

  return (
    <div className="bg-white font-barlow text-neutral-900">
      <HeaderHero
        className="!min-h-[40vh]"
        description={au.hero.description}
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle={au.hero.eyebrow}
        title={au.hero.title}
        videoSrc="/videos/hero-video.mp4"
      />

      <div className="rt-container flex flex-wrap justify-center gap-3 pb-8">
        <Button asChild size="md" variant="secondary">
          <Link href="#filosofia">{au.hero.ctaPhilosophy}</Link>
        </Button>
        <Button
          asChild
          aria-label={au.hero.ctaPrimaryAriaLabel}
          size="md"
          variant="default"
        >
          <Link href={journeyHref} scroll>
            {au.hero.ctaPrimary}
          </Link>
        </Button>
      </div>

      <main className="space-y-0 pb-24 md:pb-32">
        <Section id="valor" title={au.valueProps.sectionTitle}>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {au.valueProps.items.map((v) => (
              <div
                key={v.title}
                className="rounded-3xl border border-neutral-200 p-6"
              >
                <h3 className="font-barlow-condensed text-xl font-semibold">
                  {v.title}
                </h3>
                <p className="mt-2 text-neutral-600">{v.copy}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="filosofia" title={au.philosophy.sectionTitle}>
          <div className="mt-6 grid grid-cols-1 items-start gap-10 md:grid-cols-2">
            <div className="space-y-4 text-neutral-700">
              <p>{au.philosophy.p1}</p>
              <p>{au.philosophy.p2}</p>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-neutral-200">
              <Image
                alt={au.philosophy.imageAlt}
                className="object-cover"
                fill
                priority
                src={PHILOSOPHY_IMAGE}
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {au.philosophy.pills.map((pill) => (
              <Pill key={pill}>{pill}</Pill>
            ))}
          </div>
        </Section>

        <Section id="fundador" title={au.founder.sectionTitle}>
          <div className="mt-6 grid grid-cols-1 items-center gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="relative aspect-square overflow-hidden rounded-full">
                <Image
                  alt={au.founder.imageAlt}
                  className="object-cover"
                  fill
                  src={FOUNDER_IMAGE}
                />
              </div>
            </div>
            <div className="text-neutral-700 md:col-span-2">
              <p>{au.founder.p1}</p>
              <p className="mt-3">{au.founder.p2}</p>
            </div>
          </div>
        </Section>

        <Section id="metodologia" title={au.steps.sectionTitle}>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {au.steps.items.map((s) => (
              <div
                key={s.key}
                className="rounded-3xl border border-neutral-200 p-6"
              >
                <div className="text-sm text-neutral-500">
                  {au.steps.stepLabel} {s.key}
                </div>
                <h3 className="mt-1 font-barlow-condensed text-xl font-semibold">
                  {s.title}
                </h3>
                <p className="mt-2 text-neutral-600">{s.description}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="equipo" title={au.curators.sectionTitle}>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            {au.curators.items.map((c) => (
              <article
                key={c.name}
                className="rounded-3xl border border-neutral-200 p-6"
              >
                <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full">
                  <Image
                    alt={c.name}
                    className="object-cover"
                    fill
                    src={c.img}
                  />
                </div>
                <h3 className="mt-4 text-center font-barlow-condensed text-lg font-semibold">
                  {c.name}
                </h3>
                <p className="text-center text-sm text-neutral-500">{c.role}</p>
                <p className="mt-3 text-center text-neutral-700">{c.bio}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section id="pruebas" title={au.trust.sectionTitle}>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {au.trust.items.map((item) => (
              <div
                key={item.value}
                className="rounded-3xl border border-neutral-200 p-6 text-center"
              >
                <div className="font-barlow-condensed text-4xl font-bold">
                  {item.value}
                </div>
                <p className="mt-2 text-sm text-neutral-600">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-neutral-500">{au.trust.footnote}</p>
        </Section>

        <Section id="faq" title={au.faq.sectionTitle}>
          <div className="mt-6 divide-y divide-neutral-200 rounded-3xl border border-neutral-200">
            {au.faq.items.map((f, i) => (
              <details key={i} className="group open:bg-neutral-50">
                <summary className="flex cursor-pointer list-none select-none items-center justify-between p-5 md:p-6">
                  <span className="font-medium text-neutral-900">{f.q}</span>
                  <span className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 text-xs">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-6 text-neutral-700 md:px-6">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </Section>

        <Section
          className="rounded-3xl border border-neutral-200 bg-neutral-50"
          title={au.cta.title}
        >
          <p className="mx-auto mt-2 max-w-xl text-lg text-neutral-600">
            {au.cta.subtitle}
          </p>
          <Button
            asChild
            aria-label={au.cta.buttonAriaLabel}
            className="mt-6"
            size="lg"
            variant="feature"
          >
            <Link href={journeyHref} scroll>
              {au.cta.buttonText}
            </Link>
          </Button>
        </Section>
      </main>

      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            brand: { '@type': 'Brand', name: 'Randomtrip' },
            description:
              'Serendipia diseñada: viajes sorpresa curados con seguridad y gusto impecable.',
            name: 'Randomtrip',
            sameAs: [
              'https://www.instagram.com/',
              'https://www.tiktok.com/',
              'https://www.linkedin.com/',
            ],
            url: 'https://getrandomtrip.com',
          }),
        }}
        type="application/ld+json"
      />
    </div>
  );
}
