import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import HeaderHero from '@/components/journey/HeaderHero';
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

function SectionHeading({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <h2
      className="scroll-mt-24 font-serif text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl"
      id={id}
    >
      {children}
    </h2>
  );
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
    <div className="bg-white text-neutral-900">
      <HeaderHero
        className="!min-h-[40vh]"
        description={au.hero.description}
        fallbackImage="/images/bg-playa-mexico.jpg"
        subtitle={au.hero.eyebrow}
        title={au.hero.title}
        videoSrc=""
      />

      <div className="rt-container flex flex-wrap justify-center gap-3 pb-8">
        <Link
          className="rounded-2xl border border-neutral-200 px-5 py-3 text-sm hover:bg-neutral-50 md:text-base"
          href="#filosofia"
        >
          {au.hero.ctaPhilosophy}
        </Link>
        <Link
          aria-label={au.hero.ctaPrimaryAriaLabel}
          className="rounded-2xl bg-neutral-900 px-5 py-3 text-sm text-white hover:opacity-90 md:text-base"
          href={journeyHref}
        >
          {au.hero.ctaPrimary}
        </Link>
      </div>

      <main className="rt-container space-y-20 pb-24 md:space-y-24">
        <section aria-labelledby="valor">
          <SectionHeading id="valor">{au.valueProps.sectionTitle}</SectionHeading>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {au.valueProps.items.map((v) => (
              <div
                key={v.title}
                className="rounded-3xl border border-neutral-200 p-6"
              >
                <h3 className="font-serif text-xl font-semibold">{v.title}</h3>
                <p className="mt-2 text-neutral-600">{v.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="filosofia-title" id="filosofia">
          <SectionHeading id="filosofia-title">
            {au.philosophy.sectionTitle}
          </SectionHeading>
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
        </section>

        <section aria-labelledby="fundador">
          <SectionHeading id="fundador">
            {au.founder.sectionTitle}
          </SectionHeading>
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
        </section>

        <section aria-labelledby="metodologia">
          <SectionHeading id="metodologia">
            {au.steps.sectionTitle}
          </SectionHeading>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {au.steps.items.map((s) => (
              <div
                key={s.key}
                className="rounded-3xl border border-neutral-200 p-6"
              >
                <div className="text-sm text-neutral-500">
                  {au.steps.stepLabel} {s.key}
                </div>
                <h3 className="mt-1 font-serif text-xl font-semibold">
                  {s.title}
                </h3>
                <p className="mt-2 text-neutral-600">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="equipo-title" id="equipo">
          <SectionHeading id="equipo-title">
            {au.curators.sectionTitle}
          </SectionHeading>
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
                <h3 className="mt-4 text-center font-serif text-lg font-semibold">
                  {c.name}
                </h3>
                <p className="text-center text-sm text-neutral-500">{c.role}</p>
                <p className="mt-3 text-center text-neutral-700">{c.bio}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="pruebas">
          <SectionHeading id="pruebas">
            {au.trust.sectionTitle}
          </SectionHeading>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {au.trust.items.map((item) => (
              <div
                key={item.value}
                className="rounded-3xl border border-neutral-200 p-6 text-center"
              >
                <div className="font-serif text-4xl font-bold">{item.value}</div>
                <p className="mt-2 text-sm text-neutral-600">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-neutral-500">{au.trust.footnote}</p>
        </section>

        <section aria-labelledby="faq">
          <SectionHeading id="faq">{au.faq.sectionTitle}</SectionHeading>
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
        </section>

        <section className="rounded-3xl border border-neutral-200 bg-neutral-50 p-8 text-center md:p-12">
          <h3 className="font-serif text-2xl font-semibold md:text-3xl">
            {au.cta.title}
          </h3>
          <p className="mt-2 text-neutral-600">{au.cta.subtitle}</p>
          <Link
            aria-label={au.cta.buttonAriaLabel}
            className="mt-6 inline-flex rounded-2xl bg-neutral-900 px-6 py-3 text-white hover:opacity-90"
            href={journeyHref}
          >
            {au.cta.buttonText}
          </Link>
        </section>
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
