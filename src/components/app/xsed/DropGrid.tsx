'use client';

import Link from 'next/link';
import Section from '@/components/layout/Section';
import { Button } from '@/components/ui/Button';
import type { XsedPageDict } from '@/lib/types/dictionary';
import type { DropEntry } from '@/types/core';
import { DropCard } from './DropCard';

interface DropGridProps {
  content: XsedPageDict['dropGrid'];
  drops: DropEntry[];
}

export function DropGrid({ content, drops }: DropGridProps) {
  return (
    <Section>
      
        <div className="mb-12 flex flex-col gap-6 text-left md:flex-row md:items-end md:justify-between">
          <div className="font-barlow-condensed lg:whitespace-nowrap">
          <p className="text-xl font-light uppercase tracking-widest text-xsed">
                {content.eyebrow}
            </p>
            <h2 className="text-5xl font-bold uppercase leading-none md:text-7xl">
              {content.title}{' '}
              <span className="text-xsed">{content.titleHighlight}</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-neutral-500">
            {content.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4 md:grid-rows-2">
          {drops.map((drop, index) => (
            <div
              key={drop.number}
              className={
                index === 0 ? 'md:col-span-2 md:row-span-2 md:flex md:flex-col' : ''
              }
            >
              <DropCard drop={drop} big={index === 0} />
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button asChild size="lg" variant="tertiary">
            <Link href={content.ctaHref}>{content.ctaLabel}</Link>
          </Button>
        </div>

    </Section>
  );
}
