import React from 'react';
import { slugify } from '@/lib/helpers/slugify';
import { cn } from '@/lib/utils';

type SectionProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  variant?: 'default' | 'light' | 'dark';
};

const Section = ({
  children,
  title,
  subtitle,
  className,
  variant = 'default',
}: SectionProps) => {
  return (
    <section
      className={cn('text-center py-18 relative', className, {
        'bg-white text-gray-900': variant === 'default',
        'bg-gray-50 text-gray-900': variant === 'light',
        'bg-primary text-white': variant === 'dark',
      })}
    >
      <div className="mb-8 max-w-3xl mx-auto">
        <h2
          data-testid="section-title"
          className={cn('font-caveat md:text-5xl font-bold mb-6', {
            'text-gray-900': variant === 'default',
            'text-gray-50': variant === 'light',
            'text-white': variant === 'dark',
          })}
        >
          {title}
        </h2>
        <p
          className={cn(
            'font-jost text-xl text-gray-700 mx-auto leading-relaxed',
            {
              'text-gray-700': variant === 'default',
              'text-gray-900': variant === 'light',
              'text-white': variant === 'dark',
            },
          )}
        >
          {subtitle}
        </p>
      </div>
      <div className="max-w-5xl mx-auto">{children}</div>
    </section>
  );
};

export default Section;
