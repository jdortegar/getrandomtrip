import React from 'react';
import { slugify } from '@/lib/helpers/slugify';
import { cn } from '@/lib/utils';

type SectionProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  variant?: 'default' | 'light' | 'dark';
  id?: string;
  background?: string;
  fullWidth?: boolean;
};

const Section = ({
  children,
  title,
  subtitle,
  className,
  variant = 'default',
  id,
  background,
  fullWidth = false,
}: SectionProps) => {
  return (
    <section
      id={id}
      className={cn(
        'text-center py-18 relative bg-cover bg-center flex flex-col items-center justify-center',
        className,
        {
          'bg-white text-gray-900': variant === 'default',
          'bg-gray-50 text-gray-900': variant === 'light',
          'bg-primary text-white': variant === 'dark',
        },
      )}
      style={{ backgroundImage: `url(${background})` }}
    >
      {background && <div className="absolute inset-0 bg-black/50" />}
      {title && (
        <div className="mb-8 max-w-3xl mx-auto relative z-10">
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
      )}
      <div className={cn('mx-auto relative z-10', !fullWidth && 'max-w-7xl')}>
        {children}
      </div>
    </section>
  );
};

export default Section;
