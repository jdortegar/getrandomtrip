'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BrandingAnimationProps {
  className?: string;
  initialDelay?: number;
}

const BRANDING_TEXT = 'WONDER • WANDER';
const BRANDING_REPEAT_TEXT = 'Repeat';

function BrandingAnimation({
  className,
  initialDelay = 1.4,
}: BrandingAnimationProps) {
  const textAnimationDelay = initialDelay;
  const repeatTextAnimationDelay =
    initialDelay + BRANDING_TEXT.length * 0.05 + 0.4 + 0.2;
  const arrowAnimationDelay =
    initialDelay +
    BRANDING_TEXT.length * 0.05 +
    0.4 +
    0.2 +
    BRANDING_REPEAT_TEXT.length * 0.05 +
    0.4 +
    0.2 +
    0.8 +
    0.2;

  return (
    <motion.div
      className={cn('flex items-center relative text-white', className)}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.05,
            delayChildren: textAnimationDelay,
          },
        },
      }}
    >
      <motion.span className="font-barlow-condensed text-[18px] md:text-[30px] font-semibold  uppercase tracking-[6px] inline-flex">
        {BRANDING_TEXT.split('').map((char, index) => (
          <motion.span
            key={index}
            variants={{
              hidden: { x: -20, opacity: 0 },
              visible: {
                x: 0,
                opacity: 1,
                transition: {
                  duration: 0.4,
                  ease: 'easeOut',
                },
              },
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.span>
      <motion.div
        className="relative flex items-center md:w-[190px] w-fit px-4"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05,
              delayChildren: repeatTextAnimationDelay,
            },
          },
        }}
      >
        <motion.img
          alt=""
          className="w-full absolute -top-5 left-0 md:-top-10 md:-left-2 object-cover"
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          src="/assets/svg/yellow-circle.svg"
          transition={{
            duration: 0.8,
            delay:
              initialDelay +
              BRANDING_TEXT.length * 0.05 +
              0.4 +
              0.2 +
              BRANDING_REPEAT_TEXT.length * 0.05 +
              0.4 +
              0.2,
            ease: 'easeOut',
          }}
        />
        <div className="relative">
          <motion.span className="font-nothing-you-could-do text-yellow-400 text-2xl md:text-5xl inline-flex">
            {BRANDING_REPEAT_TEXT.split('').map((char, index) => (
              <motion.span
                key={index}
                variants={{
                  hidden: { x: -20, opacity: 0 },
                  visible: {
                    x: 0,
                    opacity: 1,
                    transition: {
                      duration: 0.4,
                      ease: 'easeOut',
                    },
                  },
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </motion.span>
        </div>
      </motion.div>
      <motion.div
        className="w-[200px] md:w-[300px] absolute top-8 md:top-12 left-20 md:left-25 overflow-hidden"
        animate={{ clipPath: 'inset(0 0% 0 0%)' }}
        initial={{ clipPath: 'inset(0 0% 0 100%)' }}
        transition={{
          duration: 0.8,
          delay: arrowAnimationDelay,
          ease: 'easeOut',
        }}
      >
        <img
          alt=""
          className="w-full object-cover"
          src="/assets/svg/yellow-arrow-back.svg"
        />
      </motion.div>
    </motion.div>
  );
}

export default BrandingAnimation;
