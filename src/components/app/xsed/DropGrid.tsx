'use client';

import Link from 'next/link';
import Img from '@/components/common/Img';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import { Button } from '@/components/ui/Button';
import type { XsedPageDict } from '@/lib/types/dictionary';
import type { DropEntry } from '@/types/core';

interface DropGridProps {
  content: XsedPageDict['dropGrid'];
  drops: DropEntry[];
}

function DropCard({ drop, big }: { drop: DropEntry; big: boolean }) {
  return (
    <div className={`flex flex-col text-left ${big ? 'h-full' : ''}`}>
      <div
        className={`relative overflow-hidden rounded-xl mb-2 flex-1 ${
          big ? 'flex-1 min-h-0' : 'h-52'
        }`}
      >
        <Img
          alt={drop.title}
          className="h-full w-full object-cover"
          height={big ? 600 : 220}
          src={drop.image}
          width={800}
        />
        <div className="font-barlow absolute left-6 top-3 flex items-center gap-1 text-base font-semibold text-white drop-shadow">
          <span className="text-xsed">|</span>
          <span className="font-extralight">XSED</span>
          <span className="font-bold text-xsed">Nº{drop.number}</span>
        </div>
        {drop.soldOut && (
          <div className="absolute right-3 top-3 rounded-full bg-xsed px-3 py-1 text-xs text-white">
            <span className="font-bold">SOLD OUT</span>
            {drop.soldOutDetail && (
              <span className="ml-1 font-normal">{drop.soldOutDetail}</span>
            )}
          </div>
        )}
      </div>
      <div className="mt-3 pb-3">
        <p className="font-barlow mb-1 text-xs font-bold uppercase tracking-widest text-xsed">
          {drop.date}
        </p>
        <p className="font-barlow-condensed text-3xl text-neutral-600 font-extralight">{drop.title}</p>
        <hr className="mt-2 border-xsed" />
      </div>
    </div>
  );
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
