'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export type TabItem = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type Props = {
  tabs: TabItem[];
  autoAdvanceMs?: number; // default 6000
  className?: string;
};

export default function AutoTabsCarousel({ tabs, autoAdvanceMs = 6000, className }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const timerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((idx: number) => {
    setActiveIdx((idx + tabs.length) % tabs.length);
  }, [tabs.length]);

  const next = useCallback(() => goTo(activeIdx + 1), [activeIdx, goTo]);
  const prev = useCallback(() => goTo(activeIdx - 1), [activeIdx, goTo]);

  // Auto-advance
  useEffect(() => {
    // pausa si el usuario está interactuando (hover/focus dentro del contenedor)
    const el = containerRef.current;
    const pause = () => { if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; } };
    const resume = () => {
      if (!timerRef.current) {
        timerRef.current = window.setInterval(() => {
          setActiveIdx((i) => (i + 1) % tabs.length);
        }, autoAdvanceMs) as unknown as number;
      }
    };

    resume();
    el?.addEventListener('mouseenter', pause);
    el?.addEventListener('mouseleave', resume);
    el?.addEventListener('focusin', pause);
    el?.addEventListener('focusout', resume);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      el?.removeEventListener('mouseenter', pause);
      el?.removeEventListener('mouseleave', resume);
      el?.removeEventListener('focusin', pause);
      el?.removeEventListener('focusout', resume);
    };
  }, [tabs.length, autoAdvanceMs]);

  // Teclado
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { next(); }
    if (e.key === 'ArrowLeft') { prev(); }
  };

  // Swipe básico (mobile)
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); }
    touchStartX.current = null;
  };

  return (
    <section
      ref={containerRef}
      className={clsx('w-full', className)}
      aria-label="Información clave Randomtrip"
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      tabIndex={0}
    >
      {/* Tabs header */}
      <div className="flex justify-center gap-4 md:gap-6 border-b border-neutral-200 mb-8">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            className={clsx(
              'px-3 md:px-4 py-2 text-sm md:text-base font-medium',
              i === activeIdx ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-500 hover:text-neutral-900'
            )}
            aria-selected={i === activeIdx}
            role="tab"
            onClick={() => goTo(i)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div role="tabpanel" className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {tabs[activeIdx]?.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots + arrows */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <button className="px-3 py-2 rounded-full border border-neutral-300" onClick={prev} aria-label="Anterior">←</button>
        <div className="flex items-center gap-2">
          {tabs.map((_, i) => (
            <span key={i} className={clsx('h-2 w-2 rounded-full', i === activeIdx ? 'bg-neutral-900' : 'bg-neutral-300')} />
          ))}
        </div>
        <button className="px-3 py-2 rounded-full border border-neutral-300" onClick={next} aria-label="Siguiente">→</button>
      </div>
    </section>
  );
}
