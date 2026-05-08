'use client';

import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Img from '@/components/common/Img';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { parseXsedNotificationBody } from '@/lib/xsed/notifications';
import type { XsedPageDict } from '@/lib/types/dictionary';
import Section from '@/components/layout/Section';

interface XsedHeroProps {
  className?: string;
  content: XsedPageDict['xsedHero'];
  locale: string;
}

type SubmitStatus = 'idle' | 'error' | 'invalid' | 'success';

export function XsedHero({ className, content, locale }: XsedHeroProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>('idle');

  const errorMessage =
    status === 'invalid'
        ? content.invalidEmailMessage
      : status === 'error'
        ? content.errorMessage
        : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = parseXsedNotificationBody({ email, locale });
    if (!parsed) {
      setStatus('invalid');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');
    try {
      const response = await fetch('/api/xsed/notifications', {
        body: JSON.stringify(parsed),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) {
        setStatus('error');
        return;
      }

      setEmail('');
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Section backgroundImage="/images/xsed-hero.jpg" backgroundOpacity={0.4} className="min-h-3/4">
      <div className="relative z-10 w-full px-6 md:px-20 flex justify-center items-center">
        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.h2
              key="success"
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-3xl text-center font-barlow-condensed text-5xl font-bold uppercase leading-tight text-white md:text-6xl lg:text-7xl"
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
            >
              {content.successMessage}
            </motion.h2>
          ) : (
            <motion.div
              key="default"
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="whitespace-pre-line text-center mb-6 font-barlow-condensed font-bold uppercase leading-tight text-white text-[50px] md:text-[70px]">
                {content.title}
              </h2>
              <p className="text-center mb-8 text-lg leading-relaxed text-white">
                {content.helper}
              </p>
              <form
                className="flex flex-col gap-4 md:flex-row md:items-center justify-center"
                noValidate
                onSubmit={handleSubmit}
              >
                <Input
                  aria-label={content.inputLabel}
                  className="h-14 w-full max-w-xs rounded-md border-2 border-white/40 bg-black/40 px-4 font-barlow text-base font-medium text-white shadow-none placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/30 md:w-72"
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status !== 'idle') setStatus('idle');
                  }}
                  placeholder={content.inputPlaceholder}
                  required
                  type="email"
                  value={email}
                />
                <Button
                  aria-label={content.submitAriaLabel}
                  disabled={isSubmitting}
                  size="lg"
                  type="submit"
                  variant="tertiary"
                >
                  {isSubmitting ? content.submittingLabel : content.submitLabel}
                </Button>
              </form>
              {errorMessage && (
                <p className="text-center mt-4 font-barlow text-sm font-semibold text-red-400">
                  {errorMessage}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </Section>
  );
}
