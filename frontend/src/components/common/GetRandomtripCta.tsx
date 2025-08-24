'use client';
import Link from 'next/link';
import clsx from 'clsx';
import { track } from '@/components/common/analytics';

type Props = {
  align?: 'left' | 'center';
  className?: string;
};

export default function GetRandomtripCta({ align = 'center', className = '' }: Props) {
  return (
    <div className={clsx(
      'mt-8 md:mt-12',
      align === 'center' ? 'text-center' : 'text-left',
      'flex', align === 'center' ? 'justify-center' : 'justify-start',
      className
    )}>
      <Link
        href="/?tab=Top%20Trippers#start-your-journey-anchor"
        onClick={() => track('cta_click', { area: 'global_footer_cta', label: 'getrandomtrip' })}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold tracking-wide
                   bg-[#D4AF37] text-gray-900 shadow-md transition-colors
                   hover:bg-[#EACD65] focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
      >
        GETRANDOMTRIP!
      </Link>
    </div>
  );
}