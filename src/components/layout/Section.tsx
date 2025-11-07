import React from 'react';
import { slugify } from '@/lib/helpers/slugify';
import { cn } from '@/lib/utils';
import Container from './Container';

type SectionProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  variant?: 'default' | 'light' | 'dark';
  id?: string;
  fullWidth?: boolean;
};

const Section = ({
  children,
  title,
  subtitle,
  className,
  variant = 'default',
  id,
  fullWidth = false,
}: SectionProps) => {
  return (
    <section
      className={cn(
        'text-center relative flex flex-col items-center justify-center w-full',
        className,
        {
          'bg-white text-gray-900': variant === 'default',
          'bg-gray-50 text-gray-900': variant === 'light',
          'bg-primary text-white': variant === 'dark',
        },
      )}
      id={id}
    >
      {title && (
        <div className="mb-6 max-w-4xl mx-auto relative z-10 px-4 md:mb-8">
          <h2
            className={cn(
              'font-caveat text-4xl md:text-5xl font-bold mb-4 md:mb-6',
              {
                'text-gray-900': variant === 'default',
                'text-gray-50': variant === 'light',
                'text-white': variant === 'dark',
              },
            )}
            data-testid="section-title"
          >
            {title}
          </h2>
          <p
            className={cn(
              'font-jost text-base md:text-xl text-gray-700 mx-auto leading-relaxed',
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
      <Container size={fullWidth ? 'full' : 'xl'} className="relative z-10">
        {children}
      </Container>
    </section>
  );
};

export default Section;
