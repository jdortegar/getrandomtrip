'use client';

import { HERO_CONTENT } from '@/lib/data/constants/hero';

export function HeroScrollIndicator() {
  return (
    <>
      <style jsx global>{`
        @keyframes push-pulse {
          0% {
            transform: scaleY(0.2);
            opacity: 0.8;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
          100% {
            transform: scaleY(0.2);
            opacity: 0.8;
          }
        }
        .scroll-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .scroll-indicator::after {
          content: '';
          display: block;
          width: 2px;
          height: 40px;
          background-color: white;
          margin-top: 0.75rem;
          transform-origin: bottom;
          animation: push-pulse 2s infinite;
        }
      `}</style>

      <div
        className="scroll-indicator pointer-events-none select-none z-10"
        aria-hidden="true"
      >
        {HERO_CONTENT.SCROLL_TEXT}
      </div>
    </>
  );
}
