'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import VideoBackground from '@/components/media/VideoBackground';
import { XsedNotifyForm } from '@/components/app/xsed/XsedNotifyForm';
import type { XsedPageDict } from '@/lib/types/dictionary';
import { cn } from '@/lib/utils';

interface XsedHeroProps {
  backHref?: string;
  backLabel?: string;
  className?: string;
  content: XsedPageDict['xsedHero'];
}

export function XsedHero({ backHref, backLabel, className, content }: XsedHeroProps) {
  return (
    <section className={cn('relative flex h-screen flex-col overflow-hidden', className)}>
      <VideoBackground
        fallbackImage={content.backgroundImage}
        videoSrc={content.videoSrc}
      />
      <div className="relative z-10 flex flex-col justify-center h-full rt-container md:px-20!">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="whitespace-pre-line text-center mb-10 font-barlow-condensed font-bold uppercase leading-tight text-white text-[50px] md:text-[70px]">
            {content.title}
          </h2>

          <div className="flex justify-center mb-8 text-center">
            <XsedNotifyForm variant="dark" />
          </div>
          {backHref && backLabel ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex justify-center"
              initial={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Button
                asChild
                className="text-white hover:bg-white/10 hover:text-white"
                size="sm"
                variant="ghost"
              >
                <Link href={backHref}>{backLabel}</Link>
              </Button>
            </motion.div>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
