'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { cn } from '@/lib/utils';

interface JourneyDropdownProps {
  className?: string;
  children: ReactNode;
  content: string;
  label: string;
  linkLabel?: string;
  linkHref?: string;
  value: string;
}

export function JourneyDropdown({
  children,
  className,
  content,
  label,
  linkLabel,
  linkHref,
  value,
}: JourneyDropdownProps) {
  return (
    <AccordionPrimitive.Item
      className={cn(
        'min-w-0 w-full bg-white rounded-lg p-6 shadow-md',
        className,
      )}
      value={value}
    >
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          className={cn(
            'flex flex-1 items-center justify-between',
            'hover:text-gray-900',
            '[&[data-state=open]>div:first-child>span:first-child]:text-xl',
            '[&[data-state=closed]>div:first-child>span:first-child]:text-base',
          )}
        >
          <div className="flex flex-col items-start gap-1">
            <span className="text-gray-500 text-base transition-[font-size] duration-300 ease-in-out">
              {label}
            </span>
            {/* {linkLabel && linkHref && (
              <Link
                className="text-sm text-blue-600 hover:underline"
                href={linkHref}
                onClick={(e) => e.stopPropagation()}
              >
                {linkLabel}
              </Link>
            )} */}
          </div>

          <span className="text-sm font-bold text-gray-700">{content}</span>
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>

      <AccordionPrimitive.Content className="min-w-0 overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="min-w-0 py-4">{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}
