'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
        'text-center relative flex flex-col items-center justify-center w-full py-20 px-4',
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
      <div className="mb-14">
        {eyebrow && (
          <motion.div
            className="text-base md:text-lg font-bold md:tracking-[9px] tracking-[6px] uppercase text-[#4F96B6]"
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {eyebrow}
          </motion.div>
        )}
        {title && (
          <motion.h2
            className={cn(
              'font-barlow-condensed text-[50px] md:text-[70px] uppercase font-bold mt-4 leading-none',
              {
                'text-gray-900': variant === 'default',
                'text-gray-50': variant === 'light',
                'text-white': variant === 'dark',
              },
            )}
            initial={{ y: 60, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {title}
          </motion.h2>
        )}
        {subtitle && (
          <motion.p
            className={cn('text-lg text-[#888] mx-auto mt-8 ', {
              'text-gray-700': variant === 'default',
              'text-gray-900': variant === 'light',
              'text-white': variant === 'dark',
            })}
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      <Container size={fullWidth ? 'full' : 'xl'} className="relative z-10">
        {children}
      </Container>
    </section>
  );
};

export default Section;
