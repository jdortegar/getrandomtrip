import React from 'react';
import { slugify } from '@/lib/helpers/slugify';
import { cn } from '@/lib/utils';
import Container from './Container';
import Img from '../common/Img';

type SectionProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  variant?: 'default' | 'light' | 'dark';
  id?: string;
  fullWidth?: boolean;
  style?: React.CSSProperties;
  backgroundImage?: string;
};

const Section = ({
  backgroundImage,
  children,
  title,
  subtitle,
  className,
  variant = 'default',
  id,
  fullWidth = false,
  style,
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
      style={style}
    >
      {backgroundImage && (
        <>
          <div className="absolute inset-0 z-0">
            <Img
              alt="Concierto"
              className="h-full w-full object-cover"
              height={1080}
              src={backgroundImage}
              width={1920}
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>
        </>
      )}
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
