import type { ReactNode } from 'react';
import Section from '@/components/layout/Section';
import { cn } from '@/lib/utils';

interface FullPageStatusLayoutProps {
  /** HTTP-style code shown large (e.g. "404", "403") */
  code: string;
  title: string;
  subtitle: string;
  /** Renders inside the primary circle (bouncing) */
  leadIcon: ReactNode;
  /** Primary row: main CTAs */
  actions: ReactNode;
  /** Inside the card after actions: explore links + tip */
  cardFooter: ReactNode;
  /** Below the white card: help / contact */
  pageFooter: ReactNode;
}

/** 404 / 403: same `Section` + `rt-container` shell as the client dashboard (no `HeaderHero`, no page-level navbar). */
export function FullPageStatusLayout({
  actions,
  cardFooter,
  code,
  leadIcon,
  pageFooter,
  subtitle,
  title,
}: FullPageStatusLayoutProps) {
  return (
    <Section
      className={cn(
        'min-h-[min(100dvh,960px)] justify-center py-12 md:py-20',
      )}
    >
      <div className="rt-container">
        <div className="relative mx-auto w-full max-w-4xl">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="animate-pulse absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/10 opacity-30 mix-blend-multiply blur-xl filter" />
            <div
              className="animate-pulse absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 opacity-30 mix-blend-multiply blur-xl filter"
              style={{ animationDelay: '2s' }}
            />
            <div
              className="animate-pulse absolute left-1/2 top-40 h-80 w-80 rounded-full bg-primary/8 opacity-30 mix-blend-multiply blur-xl filter"
              style={{ animationDelay: '4s' }}
            />
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-2xl md:p-12">
              <div className="mb-8">
                <div className="relative inline-block">
                  <h1 className="animate-pulse bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-8xl font-black text-transparent md:text-9xl">
                    {code}
                  </h1>
                  <div className="absolute inset-0 -z-10 text-8xl font-black text-primary/20 blur-sm md:text-9xl">
                    {code}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="relative inline-block">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-lg animate-bounce">
                    {leadIcon}
                  </div>
                  <div className="absolute inset-0 h-20 w-20 rounded-full bg-primary opacity-30 blur-md animate-ping" />
                </div>
              </div>

              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">{title}</h2>

              <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-700">{subtitle}</p>

              <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row">{actions}</div>

              {cardFooter}
            </div>

            <div className="mt-8 text-center">{pageFooter}</div>
          </div>
        </div>
      </div>
    </Section>
  );
}
