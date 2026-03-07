'use client';

import React from 'react';
import Img from '@/components/common/Img';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

export interface FaqItem {
  answer: string;
  question: string;
}

interface FaqSectionProps {
  className?: string;
  headingId?: string;
  items: FaqItem[];
}

export default function FaqSection({
  className,
  headingId = 'faq-heading',
  items,
}: FaqSectionProps) {
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby={headingId}
      className={cn('mt-10 text-left', className)}
    >
      <Accordion collapsible type="single">
        {items.map((item, index) => (
          <AccordionItem
            className="border-neutral-200"
            key={index}
            value={`faq-${index}`}
          >
            <AccordionTrigger className="flex items-center gap-3 py-4 text-left hover:no-underline [&[data-state=open]>svg]:rotate-180">
              <span
                aria-hidden
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary text-neutral-900"
              >
                <Img
                  alt="FAQ"
                  height={32}
                  src="/assets/icons/isologo.png"
                  width={32}
                />
              </span>
              <span className="flex-1 text-left font-medium text-neutral-900">
                {item.question}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pl-11 text-left text-neutral-600">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
