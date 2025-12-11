import React from 'react';
import { slugify } from '@/lib/helpers/slugify';
import { cn } from '@/lib/utils';
import Container from './Container';
import Img from '../common/Img';

type SectionProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
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
  eyebrow,
  className,
  variant = 'default',
  id,
  fullWidth = false,
  style,
}: SectionProps) => {
  return (
    <section
      className={cn(
        'text-center relative flex flex-col items-center justify-center w-full py-20',
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
      {eyebrow && (
        <div className="text-lg font-bold tracking-[9px] uppercase text-[#4F96B6] mb-2">
          {eyebrow}
        </div>
      )}
      {title && (
        <h2
          className={cn(
            'font-barlow-condensed text-[70px] mb-12 uppercase font-bold',
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
      )}
      {subtitle && (
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
      )}
      <Container size={fullWidth ? 'full' : 'xl'} className="relative z-10">
        {children}
      </Container>
    </section>
  );
};

export default Section;
