'use client';

import Container from '@/components/layout/Container';
import FaqSection, { type FaqItem } from '@/components/display/FaqSection';
import Section from '../layout/Section';

export interface FaqBlockDict {
  description: string;
  eyebrow: string;
  items: Array<{ answer: string; question: string }>;
  title: string;
}

interface FaqBlockProps {
  className?: string;
  copy: FaqBlockDict;
}

export function FaqBlock({ className, copy }: FaqBlockProps) {
  const items: FaqItem[] = copy.items.map((item) => ({
    answer: item.answer,
    question: item.question,
  }));

  return (
    <Section className={className}>
      <Container size="2xl" className="py-16 md:py-24">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between text-left w-full flex-wrap">
          <div className="max-w-2xl font-barlow-condensed lg:whitespace-nowrap">
            <p className=" text-xl font-extralight uppercase tracking-widest text-xsed">
              {copy.eyebrow}
            </p>
            <h2 className="text-[50px] md:text-[70px] uppercase font-bold leading-none">
              {copy.title}
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-neutral-500">
            {copy.description}
          </p>
        </div>
        <FaqSection items={items} />
      </Container>
    </Section>
  );
}
