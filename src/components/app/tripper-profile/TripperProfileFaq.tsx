"use client";

import { Plus } from "lucide-react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";
import type { TripperPublicProfileDict } from "@/lib/types/dictionary";

interface TripperProfileFaqProps {
  copy: TripperPublicProfileDict["faq"];
}

/** Heading on the left, three questions on the right; one answer open at a time. */
export function TripperProfileFaq({ copy }: TripperProfileFaqProps) {
  return (
    <section
      aria-labelledby="tripper-faq-title"
      className={cn("rt-container grid grid-cols-1 gap-10 border-t border-gray-200 py-12", "md:grid-cols-[minmax(0,535fr)_minmax(0,633fr)] md:gap-12 md:py-16")}
      data-component="TripperProfileFaq"
    >
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink">{copy.eyebrow}</p>
        <h2 className="mt-3 font-barlow-condensed text-[34px] font-bold leading-[1.02] tracking-[-0.025em] text-ink md:max-w-xs md:text-[42px] md:leading-none" id="tripper-faq-title">
          {copy.title}
        </h2>
        <p className="mt-5 max-w-xs text-neutral-600">{copy.aside}</p>
      </div>
      <AccordionPrimitive.Root className="border-t border-gray-300" collapsible type="single">
        {copy.items.map((item, index) => (
          <AccordionPrimitive.Item className="border-b border-gray-300" key={item.question} value={`faq-${index}`}>
            <AccordionPrimitive.Header>
              <AccordionPrimitive.Trigger
                className={cn(
                  "group flex min-h-[6.5rem] w-full items-center justify-between gap-6 py-5 text-left text-ink",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                )}
              >
                {item.question}
                <Plus aria-hidden className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-45" />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className="pb-6 pr-10 text-sm leading-relaxed text-neutral-700">
              {item.answer}
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        ))}
      </AccordionPrimitive.Root>
    </section>
  );
}
